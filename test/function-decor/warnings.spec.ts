import {expect, sinon} from "test-drive-react";
import {devMode, functionDecor, runInContext} from "../../src";


describe("function-decor dev mode warnings", () => {
    let warn = console.warn;
    beforeEach("replace console.warn with spy", () => {
        console.warn = sinon.spy();
    });

    afterEach("reset console.warn", () => {
        console.warn = warn;
    });

    // TODO: error when before hook returns truthy non-array result

    describe("after", () => {
        function overrideMethodReturnedValueWithUndefined() {
            const func = functionDecor.after(() => {
            })(
                function returnsValue() {
                    return {};
                });

            const res = func();

            expect(res).to.equal(undefined);
        }

        it("prompts a warning when after hook transformed returned value to undefined in dev mode", () => {
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
            const duckWillQuack = functionDecor.middleware(function badLeeroyBrown() {/*Don't call next()*/
            })(function duckWillQuack() {
            });
            runInContext(devMode.ON, () => {
                duckWillQuack();
                expect(console.warn).to.have.callCount(1);
                expect(console.warn).to.have.been.calledWithMatch(/\@middleware/);
                expect(console.warn).to.have.been.calledWithMatch(/badLeeroyBrown/);
                expect(console.warn).to.have.been.calledWithMatch(/duckWillQuack/);
            });
        });

        it("doesn't warn you when a middleware DOES call its 'next' function (iff devMode is turned ON)", () => {
            const duckWillQuack = functionDecor.middleware((next, args) => next(args))(function duckWillQuack() {
            });

            runInContext(devMode.ON, () => {
                duckWillQuack();
                expect(console.warn).to.have.callCount(0);
            });
        });

        it("doesn't warn you when a middleware doesn't call its 'next' function (iff devMode is turned OFF)", () => {
            const duckWillQuack = functionDecor.middleware(function badLeeroyBrown() {/*Don't call next()*/
            })(function duckWillQuack() {
            });

            runInContext(devMode.OFF, () => {
                duckWillQuack();
                expect(console.warn).to.have.callCount(0);
            });
        });
    });
});
