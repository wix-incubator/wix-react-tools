import * as React from 'react';
import {expect, sinon} from 'test-drive-react';
import {
    Class,
    registerAfter,
    registerBefore,
    registerForConstructor,
    registerMiddleware
} from "../../src/utils/class-decor";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');
import {expectSpyChain} from '../test-drivers/spy-chain';

const ORIGIN_ARGUMENT = 111;
const ORIGIN_RESULT = 222;
const METHOD = 'myMethod' as any;

// this class is used for type checking
class _Base {
    constructor(public myNumber: number = 0) {
    }

    myMethod(foo: number): number {
        return 3.14;
    }

}
type Decorator = (c:Class<_Base>) => Class<_Base>;

function makeBaseClass(spy?: sinon.SinonSpy): typeof _Base {
    return class Base extends _Base {
        myMethod(num: number): number {
            spy!(num);
            return super.myMethod(num);
        }
    };
}

/**
 * test driver
 */
function getHeritage(clazz: Class<any>): Array<Class<any>> {
    const res = [];
    while (clazz !== Object) {
        res.unshift(clazz);
        clazz = Object.getPrototypeOf(clazz.prototype).constructor;
    }
    return res;
}

describe("getHeritage", () => {
    class Foo {
    }
    class Bar extends Foo {
    }
    class Baz extends Bar {
    }
    it("works on single class", () => {
        expect(getHeritage(Foo)).to.eql([Foo]);
    });
    it("works on real chain", () => {
        expect(getHeritage(Baz)).to.eql([Foo, Bar, Baz]);
    });
});


describe("class decor API", () => {
    let Base: typeof _Base;
    describe("heritage side-effects", () => {

        function decorate<T extends _Base>(cls: Class<T>): Class<T> {
            cls = registerForConstructor(cls, () => undefined);
            cls = registerBefore(cls, 'myMethod', () => undefined);
            cls = registerAfter(cls, 'myMethod', () => undefined);
            cls = registerMiddleware(cls, 'myMethod', () => undefined);
            return cls;
        }

        // fixture class tree
        const Foo = makeBaseClass();
        @decorate @decorate @decorate
        class Bar extends Foo {
        }
        @decorate @decorate @decorate
        class Biz extends Bar {
        }
        class Baz extends Biz {
        }
        const NUM_USER_CLASSES = 3; // [Bar, Biz, Baz].length

        it('only add one class to heritage', () => {
            expect(getHeritage(Baz).length).to.eql(getHeritage(Foo).length + NUM_USER_CLASSES + 1);
        });

        it('does not change constructor name(s)', () => {
            expect(new Bar().constructor.name, 'new Bar().constructor.name').to.equal('Bar');
            expect(new Biz().constructor.name, 'new Biz().constructor.name').to.equal('Biz');
            expect(new Baz().constructor.name, 'new Baz().constructor.name').to.equal('Baz');
        });
    });

    describe("registerForConstructor", () => {
        let spy1: sinon.SinonSpy;
        let spy2: sinon.SinonSpy;

        function decor1<T extends object>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy1);
        }

        function decor2<T extends object>(cls: Class<T>): Class<T> {
            return registerForConstructor(cls, spy2);
        }

        beforeEach('init Base class', () => {
            Base = makeBaseClass();
            spy1 = sinon.spy();
            spy2 = sinon.spy();
        });

        function checkClass(UserClass: typeof Base, spy3: sinon.SinonSpy) {
            let obj = new UserClass(ORIGIN_ARGUMENT);
            expect(obj.myNumber).to.equal(ORIGIN_ARGUMENT);
            expect(spy1, 'spy1').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy2, 'spy2').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'spy3').to.have.callCount(1).and.calledWith(sinon.match.same(obj));
            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall});
        }

        it('called on instance creation (direct apply on class)', () => {
            const spy3 = sinon.spy();

            @decor2
            @decor1
            class UserClass extends Base {
                constructor(myNumber: number) {
                    expect(spy1).to.have.callCount(0);
                    expect(spy2).to.have.callCount(0);
                    super(myNumber);
                    spy3(this);
                }
            }
            checkClass(UserClass, spy3);
        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {
            const spy3 = sinon.spy();

            class UserClass extends decor2(decor1(Base)) {
                constructor(myNumber: number) {
                    super(myNumber);
                    spy3(this);
                }
            }

            checkClass(UserClass, spy3);
            expectSpyChain(
                {n: 'spy1', c: spy1.firstCall},
                {n: 'spy2', c: spy2.firstCall},
                {n: 'spy3', c: spy3.firstCall});
        });
    });

    describe("method hooks", () => {
        const SPIES = {
            decor1Pre: (target: _Base, args: [number]) => undefined,
            decor1Post: (target: _Base, res: number) => undefined,
            decor2Pre: (target: _Base, args: [number]) => undefined,
            decor2Post: (target: _Base, res: number) => undefined,
            superClassFunction: () => undefined,
            childFunction: (target: _Base, arg: number) => undefined,
        };
        Object.keys(SPIES).forEach(k => sinon.spy(SPIES, k));

        function spy(name: keyof typeof SPIES) {
            return (SPIES as any)[name] as sinon.SinonSpy;
        }
        beforeEach('init Base class', () => {
            Object.keys(SPIES).forEach((k: any) => spy(k).reset());
            Base = makeBaseClass(SPIES.superClassFunction as sinon.SinonSpy);
        });

        describe("registerBefore and registerAfter", () => {
            function decor1<T extends _Base>(cls: Class<T>): Class<T> {
                cls = registerBefore<T>(cls, METHOD, (target: T, args: [number]) => {
                    SPIES.decor1Pre(target, args);
                    return [args[0] + 1]
                });
                return registerAfter<T>(cls, METHOD, (target: T, result: number) => {
                    SPIES.decor1Post(target, result);
                    return result + 1;
                });
            }
            function decor2<T extends _Base>(cls: Class<T>): Class<T> {
                cls = registerBefore<T>(cls, METHOD, (target: T, args: [number]) => {
                    SPIES.decor2Pre(target, args);
                    return [args[0] + 1]
                });
                return registerAfter<T>(cls, METHOD, (target: T, result: number) => {
                    SPIES.decor2Post(target, result);
                    return result + 1;
                });
            }

            checkDecorationStyles(decor1, decor2);
        });

        describe("registerMiddleware", () => {
            function decor1<T extends _Base>(cls: Class<T>): Class<T> {
                return registerMiddleware<T>(cls, METHOD, (target: T, next: Function, args: [number]) => {
                    SPIES.decor1Pre(target, args);
                    const res = next(args[0] + 1);
                    SPIES.decor1Post(target, res);
                    return res + 1;
                });
            }
            function decor2<T extends _Base>(cls: Class<T>): Class<T> {
                return registerMiddleware<T>(cls, METHOD, (target: T, next: Function, args: [number]) => {
                    SPIES.decor2Pre(target, args);
                    const res = next(args[0] + 1);
                    SPIES.decor2Post(target, res);
                    return res + 1;
                });
            }
            checkDecorationStyles(decor1, decor2);
        });

        function checkDecorationStyles(decor1:Decorator, decor2:Decorator) {
            it('when direct apply on class', () => {
                @decor2
                @decor1
                class UserClass extends Base {
                    myMethod(foo: number): number {
                        SPIES.childFunction(this, foo);
                        return ORIGIN_RESULT;
                    }
                }
                checkClass(UserClass);

            });
            it('when applied on base class', () => {
                let BaseClass = decor2(decor1(Base));
                class UserClass extends BaseClass {
                    myMethod(foo: number): number {
                        SPIES.childFunction(this, foo);
                        return ORIGIN_RESULT;
                    }
                }
                checkClass(UserClass);
            });
        }

        function checkClass(UserClass: typeof Base) {
            let obj = new UserClass();
            let result = obj.myMethod(ORIGIN_ARGUMENT);
            expect(spy('decor1Pre')).to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy('decor2Pre')).to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT + 1]);
            expect(spy('superClassFunction')).to.have.callCount(0);
            expect(spy('childFunction')).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT + 2);
            expect(spy('decor2Post')).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
            expect(spy('decor1Post')).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT + 1);
            expect(result).to.equal(ORIGIN_RESULT + 2);
        }

    });
});
