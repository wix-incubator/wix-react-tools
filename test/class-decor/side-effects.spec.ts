import {expect, sinon} from "test-drive-react";
import {getHeritage, resetAll, spyAll} from "../test-drivers/test-tools";
import {chain, Class, classDecor, functionDecor} from "../../src";

const METHOD = "myMethod";

class Foo {
    myMethod() {
    }
}

describe("class decor side-effect", () => {
    const decorate = chain<Foo>(
        classDecor.onInstance<Foo>(() => undefined),
        classDecor.method<Foo>(METHOD, functionDecor.before(() => undefined)),
        classDecor.method<Foo>(METHOD, functionDecor.after(() => undefined)),
        classDecor.method<Foo>(METHOD, functionDecor.middleware(() => undefined))
    );

    // fixture class tree
    @decorate @decorate @decorate
    class Bar extends Foo {
    }

    @decorate @decorate @decorate
    class Biz extends Bar {
    }

    class Baz extends Biz {
    }

    const NUM_USER_CLASSES = 3; // [Bar, Biz, Baz].length

    it("reflects decoration well", () => {
        expect(classDecor.isDecorated(Foo), 'Foo').to.equal(false);
        expect(classDecor.isDecorated(Bar), 'Bar').to.equal(true);
        expect(classDecor.isDecorated(Biz), 'Biz').to.equal(true);
        expect(classDecor.isDecorated(Baz), 'Baz').to.equal(true);
    });

    it("only add one class to heritage per decorated level (2 total)", () => {
        expect(getHeritage(Baz).length, 'getHeritage(Baz).length').to.eql(getHeritage(Foo).length + NUM_USER_CLASSES + 2);
    });

    describe('heritage boundaries', () => {
        const hooks = spyAll({
            spySuper: () => {
            },
            spy1: () => {
            },
            spy2: () => {
            }
        });
        let Super: Class<any>;
        afterEach("reset console.warn", () => {
            resetAll(hooks);
        });

        beforeEach('init classes', () => {
            @classDecor.forceMethod<any>(METHOD, functionDecor.after(hooks.spySuper))
            class _Super {
            }

            Super = _Super;
        });

        it("init of parent class do not leak to children", () => {
            @classDecor.method<any>(METHOD, functionDecor.after(hooks.spy1))
            class Child1 extends Super {

            }

            new Super();
            const c1Inst = new Child1();

            c1Inst.myMethod();
            expect(hooks.spySuper, 'after c1Inst.myMethod()').to.have.callCount(1);
        });

        it("multiple children of decorated class do not mess each other up", () => {
            class Child1 extends Super implements Foo {
                myMethod() {
                    hooks.spy1();
                }
            }

            class Child2 extends Super implements Foo {
                myMethod() {
                    hooks.spy2();
                }
            }

            const c1Inst = new Child1();
            c1Inst.myMethod();
            expect(hooks.spySuper, 'after c1Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy1, 'after c1Inst.myMethod()').to.have.callCount(1);

            resetAll(hooks);

            const c2Inst = new Child2();
            c2Inst.myMethod();
            expect(hooks.spySuper, 'after c2Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy2, 'after c2Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy1, 'after c2Inst.myMethod()').to.have.callCount(0);
        });

        it("decorations on child of decorated class do not leak to siblings", () => {

            @classDecor.method<any>(METHOD, functionDecor.after(hooks.spy1))
            class Child1 extends Super {
            }

            @classDecor.method<any>(METHOD, functionDecor.after(hooks.spy2))
            class Child2 extends Super {
            }

            new Super();
            const c1Inst = new Child1();
            c1Inst.myMethod();
            expect(hooks.spySuper, 'after c1Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy1, 'after c1Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy2, 'after c1Inst.myMethod()').to.have.callCount(0);

            resetAll(hooks);

            const c2Inst = new Child2();
            c2Inst.myMethod();
            expect(hooks.spySuper, 'after c2Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy2, 'after c2Inst.myMethod()').to.have.callCount(1);
            expect(hooks.spy1, 'after c2Inst.myMethod()').to.have.callCount(0);
        });

        describe("after decorator", () => {
            class Blah {
                myMethod(): void {
                }
            }

            it("should not override a method on the class itself", () => {
                const spy = sinon.spy();
                const NewClass = classDecor.method<any>(METHOD, functionDecor.after(spy))(Blah);
                const inst = new (NewClass)();
                inst.myMethod();

                expect(spy).to.have.callCount(1);
                spy.reset();

                const unwrappedInst = new Blah();
                unwrappedInst.myMethod();

                expect(spy).to.have.callCount(0);
            });
        });
    });
});
