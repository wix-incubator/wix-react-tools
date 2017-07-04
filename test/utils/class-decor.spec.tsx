import * as React from 'react';
import {expect, sinon} from 'test-drive-react';
import {
    Class, registerAfter, registerBefore,
    registerForConstructor, registerMiddleware
} from "../../src/utils/class-decor";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');
import {expectSpyChain} from '../test-drivers/spy-chain';

const ORIGIN_ARGUMENT = 111;
const ORIGIN_RESULT = 222;
const METHOD = 'myMethod' as any;

// this class is used for type checking
class _Base {
    constructor(public myNumber:number = 0){}
    myMethod(foo:number):number{ return 3.14;}

}
function makeBaseClass(spy?:sinon.SinonSpy): typeof _Base {
    return class Base extends _Base{
        myMethod(num:number):number{
            spy!(num);
            return super.myMethod(num);
        }
    };
}

/**
 * test driver
 */
function getHeritage(clazz:Class<any>):Array<Class<any>>{
    const res = [];
    while(clazz !== Object){
        res.unshift(clazz);
        clazz = Object.getPrototypeOf(clazz.prototype).constructor;
    }
    return res;
}

describe("getHeritage", () => {
    class Foo{}
    class Bar extends Foo{}
    class Baz extends Bar{}
    it("works on single class", () => {
        expect (getHeritage(Foo)).to.eql([Foo]);
    });
    it("works on real chain", () => {
        expect (getHeritage(Baz)).to.eql([Foo, Bar, Baz]);
    });
});


describe("mixer", () => {
    let Base: typeof _Base;
    describe("heritage side-effects", () => {

        function decorate<T extends _Base>(cls: Class<T>): Class<T> {
            cls = registerForConstructor(cls, ()=>{});
            cls = registerBefore(cls, 'myMethod', ()=>{});
            cls = registerAfter(cls, 'myMethod', ()=>{});
            cls = registerMiddleware(cls, 'myMethod', ()=>{});
            return cls;
        }
        // fixture class tree
        const Foo = makeBaseClass();
        @decorate@decorate@decorate
        class Bar extends Foo{}
        @decorate@decorate@decorate
        class Biz extends Bar{}
        class Baz extends Biz{}
        const NUM_USER_CLASSES = 3; // [Bar, Biz, Baz].length

        it ('only add one class to heritage', ()=>{
            expect(getHeritage(Baz).length).to.eql(getHeritage(Foo).length + NUM_USER_CLASSES + 1);
        });

        it ('does not change constructor name(s)', ()=>{
            expect(new Bar().constructor.name, 'new Bar().constructor.name').to.equal('Bar');
            expect(new Biz().constructor.name, 'new Biz().constructor.name').to.equal('Biz');
            expect(new Baz().constructor.name, 'new Baz().constructor.name').to.equal('Baz');
        });
    });

    describe("registerForConstructor", () => {
        let spy1: sinon.SinonSpy;
        let spy2: sinon.SinonSpy;

        function mixin1<T extends object>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy1);
        }

        function mixin2<T extends object>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy2);
        }

        beforeEach('init Base class', () => {
            Base = makeBaseClass();
            spy1 = sinon.spy();
            spy2 = sinon.spy();
        });
        it('called on instance creation (direct apply on class)', () => {
            const spy3 = sinon.spy();

            @mixin2
            @mixin1
            class UserClass extends Base {
                constructor(myNumber:number) {
                    expect(spy1).to.have.callCount(0);
                    expect(spy2).to.have.callCount(0);
                    super(myNumber);
                    spy3(this);
                }
            }

            let obj = new UserClass(ORIGIN_ARGUMENT);
            expect(obj.myNumber).to.equal(ORIGIN_ARGUMENT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall});

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {
            const spy3 = sinon.spy();

            class UserClass extends mixin2(mixin1(Base)) {
                constructor(myNumber:number) {
                    super(myNumber);
                    spy3(this);
                }
            }
            let obj = new UserClass(ORIGIN_ARGUMENT);
            expect(obj.myNumber).to.equal(ORIGIN_ARGUMENT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy3', c: spy3.firstCall});
        });
    });

    describe("registerBefore", () => {
        let spy1: sinon.SinonSpy; // mixin 1
        let spy2: sinon.SinonSpy; // mixin 2
        let spy3: sinon.SinonSpy; // original base class
        let spy4: sinon.SinonSpy; // user class


        function mixin1<T extends object>(cls: Class<T>): Class<T> {
            return registerBefore<T>(cls, METHOD, (target:T, args:[number])=>{
                spy1(target, args);
                return [args[0]+1]
            });
        }

        function mixin2<T extends object>(cls: Class<T>): Class<T> {
            return registerBefore<T>(cls, METHOD, (target:T, args:[number])=>{
                spy2(target, args);
                return [args[0]+1]
            });
        }

        beforeEach('init Base class', () => {
            spy1 = sinon.spy();
            spy2 = sinon.spy();
            spy3 = sinon.spy();
            spy4 = sinon.spy();
            Base = makeBaseClass(spy3);
        });

        it('called on instance method (direct apply on class)', () => {

            @mixin2
            @mixin1
            class UserClass extends Base {
                myMethod(foo:number):number{
                    spy4(this, foo);
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);

            expect(result).to.equal(ORIGIN_RESULT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT+1]);
            expect(spy3, 'spy3').to.have.callCount(0);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT+2);

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy4', c: spy4.firstCall});

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {

            class UserClass extends mixin2(mixin1(Base)) {
                myMethod(foo:number):number{
                    spy4(this, foo);
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);

            expect(result).to.equal(ORIGIN_RESULT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT+1]);
            expect(spy3, 'spy3').to.have.callCount(0);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT+2);

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy4', c: spy4.firstCall});

        });
    });


    describe("registerAfter", () => {
        let spy1: sinon.SinonSpy; // mixin 1
        let spy2: sinon.SinonSpy; // mixin 2
        let spy3: sinon.SinonSpy; // original base class
        let spy4: sinon.SinonSpy; // user class


        function mixin1<T extends object>(cls: Class<T>): Class<T> {
            return registerAfter<T>(cls, METHOD, (target:T, result:number)=>{
                spy1(target, result);
                return result+1;
            });
        }

        function mixin2<T extends object>(cls: Class<T>): Class<T> {
            return registerAfter<T>(cls, METHOD, (target:T, result:number)=>{
                spy2(target, result);
                return result+1;
            });        }

        beforeEach('init Base class', () => {
            spy1 = sinon.spy();
            spy2 = sinon.spy();
            spy3 = sinon.spy();
            spy4 = sinon.spy();
            Base = makeBaseClass(spy3);
        });

        it('called on instance method (direct apply on class)', () => {

            @mixin2
            @mixin1
            class UserClass extends Base {
                myMethod(foo:number):number{
                    spy4(this, foo);
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);

            expect(result).to.equal(ORIGIN_RESULT+2);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT+1);
            expect(spy3, 'spy3').to.have.callCount(0);

            expectSpyChain(
                {n: 'spy4', c: spy4.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy1', c: spy1.firstCall});

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {

            class UserClass extends mixin2(mixin1(Base)) {
                myMethod(foo:number):number{
                    spy4(this, foo);
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);

            expect(result).to.equal(ORIGIN_RESULT+2);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT+1);
            expect(spy3, 'spy3').to.have.callCount(0);

            expectSpyChain(
                {n: 'spy4', c: spy4.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy1', c: spy1.firstCall});

        });
    });

    describe("registerMiddleware", () => {
        let spy1: sinon.SinonSpy; // mixin 1 - before
        let spy2: sinon.SinonSpy; // mixin 1 - after
        let spy3: sinon.SinonSpy; // mixin 2 - before
        let spy4: sinon.SinonSpy; // mixin 2 - after
        let spy5: sinon.SinonSpy; // original base class
        let spy6: sinon.SinonSpy; // user class


        function mixin1<T extends object>(cls: Class<T>): Class<T> {
            return registerMiddleware<T>(cls, METHOD, (target:T, next:Function, args:[number])=>{
                spy1(target, args);
                const res = next(args[0]+1);
                spy2(target, res);
                return res + 1;
            });
        }

        function mixin2<T extends object>(cls: Class<T>): Class<T> {
            return registerMiddleware<T>(cls, METHOD, (target:T, next:Function, args:[number])=>{
                spy3(target, args);
                const res = next(args[0]+1);
                spy4(target, res);
                return res + 1;
            });
        }

        beforeEach('init Base class', () => {
            spy1 = sinon.spy();
            spy2 = sinon.spy();
            spy3 = sinon.spy();
            spy4 = sinon.spy();
            spy5 = sinon.spy();
            spy6 = sinon.spy();
            Base = makeBaseClass(spy5);
        });

        it('called on instance method (direct apply on class)', () => {

            @mixin2
            @mixin1
            class UserClass extends Base {
                myMethod(foo:number):number{
                    spy6(this, foo);
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT+1]);
            expect(spy5, 'spy5').to.have.callCount(0);
            expect(spy6, 'spy6').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT+2);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT+1);
            expect(result).to.equal(ORIGIN_RESULT+2);

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy3', c: spy3.firstCall},
                {n: 'spy6', c: spy6.firstCall},
                {n: 'spy4', c: spy4.firstCall},
                {n: 'spy2', c: spy2.firstCall},
            );

        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {

            class UserClass extends mixin2(mixin1(Base)) {
                myMethod(foo:number):number{
                    spy6(this, Array.prototype.slice.call(arguments));
                    return ORIGIN_RESULT;
                }
            }

            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT+1]);
            expect(spy5, 'spy5').to.have.callCount(0);
            expect(spy6, 'spy6').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT+2]);
            expect(spy4, 'spy4').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT+1);
            expect(result).to.equal(ORIGIN_RESULT+2);

            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy3', c: spy3.firstCall},
                {n: 'spy6', c: spy6.firstCall},
                {n: 'spy4', c: spy4.firstCall},
                {n: 'spy2', c: spy2.firstCall},
            );

        });
    });
});
