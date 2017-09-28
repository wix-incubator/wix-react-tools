import {expect, sinon} from "test-drive-react";
import {after, GlobalConfig, middleware, runInContext, devMode} from "../../src";


// TODO: change tests to function-decor style (instead of class decor) and make them pass
describe("class-decor dev mode warnings", () => {
    let warn = console.warn;
    beforeEach("replace console.warn with spy", () => {
        console.warn = sinon.spy();
    });

    afterEach("reset console.warn", () => {
        console.warn = warn;
    });

    describe("after", () => {
        function overrideMethodReturnedValueWithUndefined() {
            @after<Foo>(() => undefined, 'returnsValue')
            class Foo {
                returnsValue() {
                    return {};
                }
            }
            const inst = new Foo();

            const res = inst.returnsValue();

            expect(res).to.equal(undefined);
        }

        it("prompts a warning when in dev mode", () => {
            runInContext(devMode.ON, overrideMethodReturnedValueWithUndefined);

            expect(console.warn).to.have.callCount(1);
            expect(console.warn).to.have.been.calledWith('@after returnsValue Did you forget to return a value?');
        });

        it("does not prompt a warning when not in dev mode", () => {
            runInContext(devMode.OFF, overrideMethodReturnedValueWithUndefined);

            expect(console.warn).to.have.callCount(0);
        });
    });

    describe("middleware", () => {
        it("warns you when a middleware doesn't call its 'next' function (iff deMode is turned ON)", () => {
            @middleware<Duck>(function badLeeroyBrown() {
                //Don't call next()
            }, "duckWillQuack")
            class Duck {
                duckWillQuack: () => void;
            }
            let duck = new Duck();

            runInContext(devMode.ON, () => {
                duck.duckWillQuack();
                expect(console.warn).to.have.callCount(1);
                expect(console.warn).to.have.been.calledWithMatch(/\@middleware/);
                expect(console.warn).to.have.been.calledWithMatch(/badLeeroyBrown/);
                expect(console.warn).to.have.been.calledWithMatch(/duckWillQuack/);
            });
        });

        it("doesn't warn you when a middleware DOES call its 'next' function (iff devMode is turned ON)", () => {
            @middleware<Duck>((next, args) => {
                next(args);
            }, "duckWillQuack")
            class Duck {
                duckWillQuack: () => void;
            }
            let duck = new Duck();

            runInContext(devMode.ON, () => {
                duck.duckWillQuack();
                expect(console.warn).to.have.callCount(0);
            });
        });

        it("doesn't warn you when a middleware doesn't call its 'next' function (iff devMode is turned OFF)", () => {
            @middleware<Duck>(() => {
                //Don't call next()
            }, "duckWillQuack")
            class Duck {
                duckWillQuack: () => void;
            }
            let duck = new Duck();

            runInContext(devMode.OFF, () => {
                duck.duckWillQuack();
                expect(console.warn).to.have.callCount(0);
            });
        });
    });
});
