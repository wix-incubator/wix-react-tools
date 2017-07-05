import * as React from 'react';
import {expect, sinon} from 'test-drive-react';
import {
    Class,
    after,
    before as beforeMethod,
    preConstruct,
    middleware
} from "../../src/utils/class-decor";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');
import {expectSpyChain} from '../test-drivers/spy-chain';
import {getHeritage, resetAll, spyAll} from "../test-tools";

const ORIGIN_ARGUMENT = 111;
const ORIGIN_RESULT = 222;
const PARENT_RESULT = 333;
const METHOD = 'myMethod' as any;

// this class is used for type checking
class _Base {
    constructor(public myNumber: number = 0) {
    }

    myMethod(foo: number): number {
        return PARENT_RESULT;
    }

}
type Decorator = (c: Class<_Base>) => Class<_Base>;

function makeBaseClass(spy?: sinon.SinonSpy): typeof _Base {
    return class Base extends _Base {
        myMethod(num: number): number {
            spy!(num);
            return super.myMethod(num);
        }
    };
}

describe("class decor API", () => {
    let Base: typeof _Base;
    describe("heritage side-effects", () => {

        function decorate<T extends _Base>(cls: Class<T>): Class<T> {
            cls = preConstruct(cls, () => undefined);
            cls = beforeMethod(cls, 'myMethod', () => undefined);
            cls = after(cls, 'myMethod', () => undefined);
            cls = middleware(cls, 'myMethod', () => undefined);
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

    describe("preConstruct", () => {
        let first: sinon.SinonSpy;
        let last: sinon.SinonSpy;
        let userConstructorSpy: sinon.SinonSpy;

        function decor1<T extends object>(cls: Class<T>): Class<T> {
            return preConstruct(cls, first);
        }

        function decor2<T extends object>(cls: Class<T>): Class<T> {
            return preConstruct(cls, last);
        }

        beforeEach('init Base class', () => {
            Base = makeBaseClass();
            first = sinon.spy();
            last = sinon.spy();
            userConstructorSpy = sinon.spy();
        });

        it('called on instance creation (direct apply on class)', () => {

            @decor2
            @decor1
            class UserClass extends Base {
                constructor(myNumber: number) {
                    expect(first).to.have.callCount(0);
                    expect(last).to.have.callCount(0);
                    super(myNumber);
                    userConstructorSpy(this);
                }
            }
            checkClass(UserClass, userConstructorSpy);
        });
        it('when applied on parent class, called on instance creation before user code constructor', () => {

            class UserClass extends decor2(decor1(Base)) {
                constructor(myNumber: number) {
                    super(myNumber);
                    userConstructorSpy(this);
                }
            }

            checkClass(UserClass, userConstructorSpy);
            expectSpyChain(
                {n: 'first', c: first.firstCall},
                {n: 'last', c: last.firstCall},
                {n: 'userConstructorSpy', c: userConstructorSpy.firstCall});
        });

        function checkClass(UserClass: typeof Base, spy3: sinon.SinonSpy) {
            let obj = new UserClass(ORIGIN_ARGUMENT);
            expect(obj.myNumber).to.equal(ORIGIN_ARGUMENT);
            expect(first, 'first').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(last, 'last').to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
            expect(spy3, 'userConstructorSpy').to.have.callCount(1).and.calledWith(sinon.match.same(obj));
            expectSpyChain(
                {n: 'first', c: first.firstCall},
                {n: 'last', c: last.firstCall});
        }

    });

    describe("method hooks", () => {

        const SPIES = spyAll({
            firstBefore: (target: _Base, args: [number]) => undefined,
            lastBefore: (target: _Base, args: [number]) => undefined,
            firstAfter: (target: _Base, res: number) => undefined,
            lastAfter: (target: _Base, res: number) => undefined,
            superClassFunction: () => undefined,
            childFunction: (target: _Base, arg: number) => undefined,
        });

        describe("priority", () => {

            function beforeAfterDecor<T extends _Base>(cls: Class<T>): Class<T> {
                cls = beforeMethod<T>(cls, METHOD, (target: T, args: [number]) => {
                    SPIES.firstBefore(target, args);
                    return [args[0] + 1]
                });
                return after<T>(cls, METHOD, (target: T, result: number) => {
                    SPIES.lastAfter(target, result);
                    return result + 1;
                });
            }

            function middlewareDecor<T extends _Base>(cls: Class<T>): Class<T> {
                return middleware<T>(cls, METHOD, (target: T, next: Function, args: [number]) => {
                    SPIES.lastBefore(target, args);
                    const res = next(args[0] + 1);
                    SPIES.firstAfter(target, res);
                    return res + 1;
                });
            }

            describe("before & after wraps middleware when applied first", () => {
                checkDecorationStyles(beforeAfterDecor, middlewareDecor, true);
            });
            describe("before & after wraps middleware also when applied last", () => {
                checkDecorationStyles(middlewareDecor, beforeAfterDecor, true);
            });

        });

        describe("before and after", () => {
            function outer<T extends _Base>(cls: Class<T>): Class<T> {
                cls = beforeMethod<T>(cls, METHOD, (target: T, args: [number]) => {
                    SPIES.firstBefore(target, args);
                    return [args[0] + 1]
                });
                return after<T>(cls, METHOD, (target: T, result: number) => {
                    SPIES.lastAfter(target, result);
                    return result + 1;
                });
            }

            function inner<T extends _Base>(cls: Class<T>): Class<T> {
                cls = beforeMethod<T>(cls, METHOD, (target: T, args: [number]) => {
                    SPIES.lastBefore(target, args);
                    return [args[0] + 1]
                });
                return after<T>(cls, METHOD, (target: T, result: number) => {
                    SPIES.firstAfter(target, result);
                    return result + 1;
                });
            }

            // first  is outer, last is inner
            checkDecorationStyles(outer, inner);
        });

        describe("middleware", () => {
            function outer<T extends _Base>(cls: Class<T>): Class<T> {
                return middleware<T>(cls, METHOD, (target: T, next: Function, args: [number]) => {
                    SPIES.firstBefore(target, args);
                    const res = next(args[0] + 1);
                    SPIES.lastAfter(target, res);
                    return res + 1;
                });
            }

            function inner<T extends _Base>(cls: Class<T>): Class<T> {
                return middleware<T>(cls, METHOD, (target: T, next: Function, args: [number]) => {
                    SPIES.lastBefore(target, args);
                    const res = next(args[0] + 1);
                    SPIES.firstAfter(target, res);
                    return res + 1;
                });
            }

            // first  is outer, last is inner
            checkDecorationStyles(outer, inner);
        });

        function checkDecorationStyles(first: Decorator, second: Decorator, sampleTest=false) {
            let UserClass: typeof _Base;

            describe('when applied on base class', () => {
                before('define classes', () => {
                    Base = second(first(makeBaseClass(SPIES.superClassFunction)));
                    class _UserClass extends Base {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);
            });
            describe('when direct apply on class', () => {
                before('define classes', () => {
                    Base = makeBaseClass(SPIES.superClassFunction);
                    @second
                    @first
                    class _UserClass extends Base {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);

            });

            function checkClass(sampleTest=false) {
                let obj1:_Base, obj2:_Base;
                before('define classes', () => {
                    obj1 = new UserClass();
                    obj2 = new UserClass();
                });
                if (sampleTest){
                    checkMethod(() => obj1, 'single test');
                } else {
                    checkMethod(() => obj1, 'first instance, first method execution');
                    checkMethod(() => obj2, 'second instance, first method execution');
                    checkMethod(() => obj2, 'second instance, second method execution');
                }
            }
        }


        function checkMethod(objProvider: ()=>_Base, runId: string) {
            it(runId, () => {
                resetAll(SPIES);
                const obj = objProvider();
                const result = obj.myMethod(ORIGIN_ARGUMENT);
                expect(SPIES.firstBefore).to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT]);
                expect(SPIES.lastBefore).to.have.callCount(1).and.calledWith(sinon.match.same(obj), [ORIGIN_ARGUMENT + 1]);
                expect(SPIES.superClassFunction).to.have.callCount(0);
                expect(SPIES.childFunction).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_ARGUMENT + 2);
                expect(SPIES.firstAfter).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT);
                expect(SPIES.lastAfter).to.have.callCount(1).and.calledWith(sinon.match.same(obj), ORIGIN_RESULT + 1);
                expect(result).to.equal(ORIGIN_RESULT + 2);
            });
        }
    });
});
