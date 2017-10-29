import * as React from "react";
import {expect, sinon} from "test-drive-react";
import {testWithBothComponentTypes} from "../test-drivers/test-tools";
import {ElementArgs, reactDecor, StatelessElementHook} from "../../src";
import {featuresApi} from "../../src/wrappers/index";

type PropsWithName = { name: string };

const SFComp: React.SFC<PropsWithName> = ({name}) => (
    <div/>
);

const hook: StatelessElementHook<PropsWithName> = (_p: PropsWithName, args: ElementArgs<any>): ElementArgs<any> => {
    return args;
};
const wrapper = reactDecor.makeFeature([hook]);
const wrapper2 = reactDecor.makeFeature([hook]);

describe("react-decorator-reflection", () => {
    describe("reactDecor.isDecorated", () => {
        function suite(Comp: any) {
            const WrappedComp = wrapper(Comp);

            it("should return false on an undecorated component", () => {
                expect(reactDecor.isDecorated(Comp)).to.equal(false);
            });

            it("should return true for a wrapped component", () => {

                expect(reactDecor.isDecorated(WrappedComp)).to.equal(true);
            });

            it("should return false for a component not wrapped", () => {

                expect(reactDecor.isDecorated(Comp, wrapper)).to.equal(false);
            });

            it("should return false for a component not wrapped by specific wrapper", () => {
                expect(reactDecor.isDecorated(WrappedComp, wrapper2)).to.equal(false);
            });

            it("should return true for a component wrapped by a single decorator", () => {
                expect(reactDecor.isDecorated(WrappedComp, wrapper)).to.equal(true);
            });

            it("should return true for a component wrapped by multiple specific decorators", () => {
                const WrappedComp2 = wrapper2(WrappedComp);

                expect(reactDecor.isDecorated(WrappedComp2, wrapper)).to.equal(true);
                expect(reactDecor.isDecorated(WrappedComp2, wrapper2)).to.equal(true);
            });

            it("should work with custom symbols", () => {
                const wrapper3 = reactDecor.makeFeature([hook]);
                const symbol = {};
                featuresApi.addSymbolToFeature(wrapper3, symbol);
                const anotherWrappedComp = wrapper3(Comp);

                expect(reactDecor.isDecorated(anotherWrappedComp, symbol), 'isDecorated by known symbol').to.equal(true);
                expect(reactDecor.isDecorated(anotherWrappedComp, {}), 'isDecorated by unknown symbol').to.equal(false);
            });

            describe("with console stubbing", () => {
                const sandbox = sinon.sandbox.create();
                beforeEach(() => sandbox.stub(console, 'warn'));
                afterEach(() => sandbox.restore());
            })
        }

        testWithBothComponentTypes(SFComp, suite);
    });

    describe("reactDecor.getOriginal", () => {
        function suite(Comp: any) {
            const WrappedComp = wrapper(Comp);

            it("should return null on an undecorated component", () => {
                expect(reactDecor.getOriginal(Comp)).to.equal(null);
            });

            it("should return original component for a wrapped component", () => {
                expect(reactDecor.getOriginal(WrappedComp)).to.equal(Comp);
            });

            it("should return original component for a component wrapped by multiple specific decorators", () => {
                const WrappedComp2 = wrapper2(WrappedComp);
                expect(reactDecor.getOriginal(WrappedComp2)).to.equal(Comp);
            });
        }

        testWithBothComponentTypes(SFComp, suite);
    });
});
