import {expect, sinon} from "test-drive-react";
import {getHeritage, resetAll, spyAll} from "../../test-tools";
import {after, before, onInstance, chain, middleware} from "../../../src/";

const METHOD = "myMethod";

class Foo {
    myMethod() {}
}
describe("class decor side-effect", () => {
    const decorate = chain<Foo>(
        onInstance<Foo>(() => undefined),
        before<Foo>(() => undefined, METHOD),
        after<Foo>(() => undefined, METHOD),
        middleware<Foo>(() => undefined, METHOD)
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

    it("only add one class to heritage", () => {
        expect(getHeritage(Baz).length).to.eql(getHeritage(Foo).length + NUM_USER_CLASSES + 1);
    });

    it("does not change constructor name(s)", () => {
        expect(new Bar().constructor.name, "new Bar().constructor.name").to.equal("Bar");
        expect(new Biz().constructor.name, "new Biz().constructor.name").to.equal("Biz");
        expect(new Baz().constructor.name, "new Baz().constructor.name").to.equal("Baz");
    });

    describe('heritage boundaries', () => {
        const hooks = spyAll({
            spySuper: ()=>{},
            spy1: ()=>{},
            spy2: ()=>{}
        });
        let Child1: typeof Foo;
        let Child2: typeof Foo;
        afterEach("reset console.warn", () => {
            resetAll(hooks);
        });

        beforeEach('init classes', ()=>{
            @after(hooks.spySuper, METHOD)
            class Super{
            }
            Child1 = class extends Super  implements Foo{
                myMethod(){
                    hooks.spy1();
                }
            };
            Child2 = class extends Super  implements Foo{
                myMethod(){
                    hooks.spy2();
                }
            };
        });

        it("multiple children of decorated class do not mess each other up", () => {
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

        xit("decorations on child of decorated class do not leak to siblings", () => {
            // const spy = sinon.spy();
            //
            // @after(spy, METHOD)
            // abstract class Super implements Foo{
            //     abstract myMethod():void;
            // }
            //
            // @mix2
            // class Child1 extends Super{
            // }
            //
            // class Child2 extends Super {
            // } // mix2 applies! This is not the expected behavior
        });

        xdescribe("after decorator", () => {
            class Blah {
                myMethod(): void {}
            }

            it("should not override a method on the class itself", () => {
                const spy = sinon.spy();
                const inst = new (after(spy, METHOD, Blah))();
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
