import {expect, sinon} from "test-drive-react";
import {Class, after, before, chain, ClassDecorator, middleware, onInstance} from "../../../../src";
import {expectSpyChain, resetAll, spyAll} from "../../../test-drivers/test-tools";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');
import {mix} from "../../../../src/old/utils/class-decor/mixer";

const ORIGIN_ARGUMENT = 111;
const ORIGIN_RESULT = 222;
const PARENT_RESULT = 333;
const METHOD = 'myMethod' as any;

// this class is used as base class and type for the tests
class Base {
    constructor(public myNumber: number = 0) {
    }

    myMethod(foo: number): number {
        return PARENT_RESULT;
    }

}
type Decorator = ClassDecorator<Base>;

function makeBaseClass(spy?: sinon.SinonSpy): typeof Base {
    return class extends Base {
        myMethod(num: number): number {
            spy!(num);
            return super.myMethod(num);
        }
    };
}

describe("class decor inheritance", () => {
    describe("onInstance", () => {
        let first: sinon.SinonSpy;
        let last: sinon.SinonSpy;
        let userConstructorSpy: sinon.SinonSpy;

        beforeEach('init Base class', () => {
            first = sinon.spy();
            last = sinon.spy();
            userConstructorSpy = sinon.spy();
        });

        it('called on instance creation (direct apply on class)', () => {

            @onInstance<Base>(last)
            @onInstance<Base>(first)
            class UserClass extends makeBaseClass() {
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

            const decorate = chain(onInstance<Base>(first), onInstance<Base>(last));
            class UserClass extends decorate(makeBaseClass()) {
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
            firstBefore: (target: Base, args: [number]) => undefined,
            lastBefore: (target: Base, args: [number]) => undefined,
            firstAfter: (target: Base, res: number) => undefined,
            lastAfter: (target: Base, res: number) => undefined,
            superClassFunction: () => undefined,
            childFunction: (target: Base, arg: number) => undefined,
        });

        describe("priority", () => {

            function beforeAfterDecor<T extends Base>(cls: Class<T>): Class<T> {
                return chain(
                    before<T>((target: T, args: [number]) => {
                        SPIES.firstBefore(target, args);
                        return [args[0] + 1]
                    }, METHOD),
                    after<T>((target: T, result: number) => {
                        SPIES.lastAfter(target, result);
                        return result + 1;
                    }, METHOD))(cls);
            }

            function middlewareDecor<T extends Base>(cls: Class<T>): Class<T> {
                return middleware<T>((target: T, next: Function, args: [number]) => {
                    SPIES.lastBefore(target, args);
                    const res = next([args[0] + 1]);
                    SPIES.firstAfter(target, res);
                    return res + 1;
                }, METHOD, cls);
            }

            describe("before & after wraps middleware when applied first", () => {
                checkDecorationStyles(beforeAfterDecor, middlewareDecor, true);
            });
            describe("before & after wraps middleware also when applied last", () => {
                checkDecorationStyles(middlewareDecor, beforeAfterDecor, true);
            });

        });

        describe("before and after", () => {
            function outer<T extends Base>(cls: Class<T>): Class<T> {
                return chain(
                    before<T>((target: T, args: [number]) => {
                        SPIES.firstBefore(target, args);
                        return [args[0] + 1]
                    }, METHOD),
                    after<T>((target: T, result: number) => {
                        SPIES.lastAfter(target, result);
                        return result + 1;
                    }, METHOD))(cls);
            }

            function inner<T extends Base>(cls: Class<T>): Class<T> {
                return chain(
                    before<T>((target: T, args: [number]) => {
                        SPIES.lastBefore(target, args);
                        return [args[0] + 1]
                    }, METHOD),
                    after<T>((target: T, result: number) => {
                        SPIES.firstAfter(target, result);
                        return result + 1;
                    }, METHOD))(cls);
            }

            // first is outer, last is inner
            checkDecorationStyles(outer, inner);
        });

        describe("middleware", () => {
            function outer<T extends Base>(cls: Class<T>): Class<T> {
                return middleware<T>((target: T, next: Function, args: [number]) => {
                    SPIES.firstBefore(target, args);
                    const res = next([args[0] + 1]);
                    SPIES.lastAfter(target, res);
                    return res + 1;
                }, METHOD, cls);
            }

            function inner<T extends Base>(cls: Class<T>): Class<T> {
                return middleware<T>((target: T, next: Function, args: [number]) => {
                    SPIES.lastBefore(target, args);
                    const res = next([args[0] + 1]);
                    SPIES.firstAfter(target, res);
                    return res + 1;
                }, METHOD, cls);
            }

            // first  is outer, last is inner
            checkDecorationStyles(outer, inner);
        });

        function checkDecorationStyles(first: Decorator, second: Decorator, sampleTest = false) {
            let UserClass: typeof Base;

            describe('when applied on parent', () => {
                beforeEach('define classes', () => {
                    const Parent = second(first(makeBaseClass(SPIES.superClassFunction)));
                    class _UserClass extends Parent {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);
            });

            describe('when applied on parent of child with other decorations', () => {
                beforeEach('define classes', () => {
                    const Parent = second(first(makeBaseClass(SPIES.superClassFunction)));
                    class _UserClass extends Parent {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    // mix simulates other decorators creating another subclass with no reference to myMethod
                    UserClass = mix(_UserClass);
                });
                checkClass(sampleTest);
            });

            describe('when apply on child', () => {
                beforeEach('define classes', () => {
                    const Parent = makeBaseClass(SPIES.superClassFunction);
                    @second
                    @first
                    class _UserClass extends Parent {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);

            });

            describe('when apply on both parent and child', () => {
                beforeEach('define classes', () => {
                    const Parent = first(makeBaseClass(SPIES.superClassFunction));
                    @second
                    class _UserClass extends Parent {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);

            });

            describe('when apply on both parent and child, 2 generations apart', () => {
                beforeEach('define classes', () => {
                    const Parent = first(makeBaseClass(SPIES.superClassFunction));
                    class P1 extends Parent {}
                    class P2 extends P1 {}
                    @second
                    class _UserClass extends P2 {
                        myMethod(foo: number): number {
                            SPIES.childFunction(this, foo);
                            return ORIGIN_RESULT;
                        }
                    }
                    UserClass = _UserClass;
                });
                checkClass(sampleTest);
            });

            function checkClass(sampleTest = false) {
                let obj1: Base, obj2: Base;
                beforeEach('define classes', () => {
                    obj1 = new UserClass();
                    obj2 = new UserClass();
                });
                if (sampleTest) {
                    checkMethod(() => obj1, 'single test');
                } else {
                    checkMethod(() => obj1, 'first instance, first method execution');
                    checkMethod(() => obj2, 'second instance, first method execution');
                    checkMethod(() => obj2, 'second instance, second method execution');
                }
            }
        }

        function checkMethod(objProvider: () => Base, runId: string) {
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
