import { expect, sinon } from 'test-drive-react';
import { after as afterMethod, runInContext, Flags } from "../../../src/";

describe("after decorator", () => {
    it("lets you add hooks for non-existent functions - after", () => {
        @afterMethod<Duck>((instance, methodReturn) => {
            return methodReturn;
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        expect(() => {
            duck.duckWillQuack();
        }).not.to.throw();
    });

    describe("warning on overriding values with undefined", () => {
        let warn = console.warn;
        beforeEach("replace console.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            console.warn = warn;
        });

        function overrideMethodReturnedValueWithUndefined() {
            @afterMethod<Foo>(() => undefined, 'returnsValue')
            class Foo {
                returnsValue() {
                    return {};
                }
            }
            const inst = new Foo();

            const res = inst.returnsValue();

            expect(res).to.equal(undefined);
        }

        it("should prompt a warning when in dev mode", () => {
            runInContext({ [Flags.DEV_MODE]: true }, overrideMethodReturnedValueWithUndefined);

            expect(console.warn).to.have.callCount(1);
            expect(console.warn).to.have.been.calledWith('@after returnsValue Did you forget to return a value?');
        });

        it("should not prompt a warning when not in dev mode", () => {
            runInContext({ [Flags.DEV_MODE]: false }, overrideMethodReturnedValueWithUndefined);

            expect(console.warn).to.have.callCount(0);
        });
    });
});
