import { expect, sinon } from 'test-drive-react';
import { after as afterMethod } from "../../../src/utils/class-decor";
import { runInContext } from "../../../src/utils/config";

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

        class Foo {
            returnsValue() {
                return {};
            }
        }

        it("should prompt a warning when in dev mode", () => {
            runInContext({ devMode: true }, () => {
                const inst = new (afterMethod(() => undefined, 'returnsValue', Foo))();

                const res = inst.returnsValue();

                expect(console.warn).to.have.callCount(1);
                expect(console.warn).to.have.been.calledWith('@after returnsValue Did you forget to return a value?');
                expect(res).to.equal(undefined);
            });
        });

        it("should not prompt a warning when not in dev mode", () => {
            runInContext({ devMode: false }, () => {
                const inst = new (afterMethod(() => undefined, 'returnsValue', Foo))();

                const res = inst.returnsValue();

                expect(console.warn).to.have.callCount(0);
                expect(res).to.equal(undefined);
            });
        });
    });
});
