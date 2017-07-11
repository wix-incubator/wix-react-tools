import { expect, sinon } from 'test-drive-react';
import { after as afterMethod } from "../../../src/utils/class-decor";
import { overrideGlobalConfig } from "../../../src/utils/config";

describe("after decorator", () => {
    describe("with devMode enabled", () => {
        before("setup", () => {
            overrideGlobalConfig({
                devMode: true
            });
        });

        let warn = console.warn;

        beforeEach("replace console.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            console.warn = warn;
        });

        after("reset global config", () => {
            overrideGlobalConfig({});
        });

        function returnsUndefined(clazz: Foo, methodResult: string):void {}

        function returnsValue(clazz: Foo, methodResult: string):string {
            return 'value';
        }

        class Foo {
            returnsUndefined(): void {}

            returnsValue() {
                return {};
            }
        }

        it("should not prompt a warning when component returns undefined and decorator returns a different result", () => {
            const inst = new (afterMethod(returnsValue, 'returnsUndefined', class extends Foo{}))();

            const res = inst.returnsUndefined();

            expect(console.warn).to.have.callCount(0);
            expect(res).to.equal('value');
        });

        it("should not prompt a warning when method and decorator return different values (not undefined)", () => {
            const inst = new (afterMethod(returnsValue, 'returnsValue', class extends Foo{}))();

            const res = inst.returnsValue();

            expect(console.warn).to.have.callCount(0);
            expect(res).to.equal('value'); // remove?
        });

        it("should not prompt when both method and decorator return undefined", () => {
            debugger;
            const inst = new (afterMethod(returnsUndefined, 'returnsUndefined', class extends Foo{}))();

            const res = inst.returnsUndefined();

            expect(console.warn).to.have.callCount(0);
            expect(res).to.equal(undefined);
        });

        it("should prompt a warning when method returns a value and the decorator returns undefined", () => {
            const inst = new (afterMethod(returnsUndefined, 'returnsValue', class extends Foo{}))();

            const res = inst.returnsValue();

            expect(console.warn).to.have.callCount(1);
            expect(console.warn).to.have.been.calledWith('@after returnsValue Did you forget to return a value?');
            expect(res).to.equal(undefined);
        });
    });

    describe("with devMode disabled", () => {
        before("setup", () => {
            overrideGlobalConfig({
                devMode: false
            });
        });
    });
});
