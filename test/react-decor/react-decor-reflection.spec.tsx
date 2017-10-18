import * as React from "react";
import {expect, sinon} from "test-drive-react";
import {testWithBothComponentTypes} from "../test-drivers/test-tools";
import {decorateReactComponent, ElementArgs, reactDecor, StatelessElementHook} from "../../src";

type PropsWithName = { name: string };

const SFComp: React.SFC<PropsWithName> = ({name}) => (
    <div/>
);

const hook: StatelessElementHook<PropsWithName> = (_p: PropsWithName, args: ElementArgs<any>): ElementArgs<any> => {
    return args;
};
const wrapper = decorateReactComponent([hook]);
const wrapper2 = decorateReactComponent([hook]);

describe("react-decorator-reflection", () => {
    describe("reactDecor.isWrapped", () => {
        function suite(Comp: any) {
            const WrappedComp = wrapper(Comp);

            it("should return false on an undecorated component", () => {
                expect(reactDecor.isWrapped(Comp)).to.equal(false);
            });

            it("should return true for a wrapped component", () => {

                expect(reactDecor.isWrapped(WrappedComp)).to.equal(true);
            });

            it("should return false for a component not wrapped", () => {

                expect(reactDecor.isWrapped(Comp, wrapper)).to.equal(false);
            });

            it("should return false for a component not wrapped by specific wrapper", () => {
                expect(reactDecor.isWrapped(WrappedComp, wrapper2)).to.equal(false);
            });

            it("should return true for a component wrapped by a single decorator", () => {
                expect(reactDecor.isWrapped(WrappedComp, wrapper)).to.equal(true);
            });

            it("should return true for a component wrapped by multiple specific decorators", () => {
                const WrappedComp2 = wrapper2(WrappedComp);

                expect(reactDecor.isWrapped(WrappedComp2, wrapper)).to.equal(true);
                expect(reactDecor.isWrapped(WrappedComp2, wrapper2)).to.equal(true);
            });

            describe("with console stubbing", () => {
                const sandbox = sinon.sandbox.create();
                beforeEach(() => sandbox.stub(console, 'warn'));
                afterEach(() => sandbox.restore());
            })
        }

        testWithBothComponentTypes(SFComp, suite);
    });

    describe("reactDecor.getWrapped", () => {
        function suite(Comp: any) {
            const WrappedComp = wrapper(Comp);

            it("should return null on an undecorated component", () => {
                expect(reactDecor.getWrapped(Comp)).to.equal(null);
            });

            it("should return original component for a wrapped component", () => {
                expect(reactDecor.getWrapped(WrappedComp)).to.equal(Comp);
            });

            it("should return original component for a component wrapped by multiple specific decorators", () => {
                const WrappedComp2 = wrapper2(WrappedComp);
                expect(reactDecor.getWrapped(WrappedComp2)).to.equal(Comp);
            });
        }

        testWithBothComponentTypes(SFComp, suite);
    });
});
