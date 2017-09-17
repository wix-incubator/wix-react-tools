import * as React from "react";
import { expect, sinon } from "test-drive-react";
import { testWithBothComponentTypes } from "../test-drivers/test-tools";
import { ElementArgs } from "../../src/react-decor/common";
import { runInContext } from "../../src/core/config";
import { decorateReactComponent, decorationReflection, StatefulElementHook, StatelessElementHook } from "../../src";

type PropsWithName = { name: string };

const SFComp: React.SFC<PropsWithName> = ({name}) => (
    <div data-automation-id="root" data-delete-me="TBDeleted" data-change-me="TBChanged">
        <span data-automation-id="content">
            {name}
        </span>
    </div>
);

const hook: StatelessElementHook<PropsWithName> = (_p: PropsWithName, args: ElementArgs<any>): ElementArgs<any> => {
    return args;
};

describe("react-decorator-reflection", () => {
    describe("isDecorated", () => {
        function suite(Comp: any) {
            it("should return false on an undecorated component", () => {
                expect(decorationReflection.isDecorated(Comp)).to.equal(false);
            });
    
            it("should return true for a wrapped component", () => {
                const wrapper = decorateReactComponent({onEachElement: [hook]});

                const WrappedComp = wrapper(Comp);
    
                expect(decorationReflection.isDecorated(WrappedComp)).to.equal(true);
            });
    
            it("should return false for a component not wrapped", () => {
                const wrapper = decorateReactComponent({onEachElement: [hook]});
                
                expect(decorationReflection.isDecorated(Comp, wrapper)).to.equal(false);
            });

            it("should return false for a component not wrapped by specific wrapper", () => {
                const wrapper = decorateReactComponent({onEachElement: [hook]});
                const wrapper2 = decorateReactComponent({onEachElement: [hook]});

                const WrappedComp = wrapper(Comp);
                
                expect(decorationReflection.isDecorated(WrappedComp, wrapper2)).to.equal(false);
            });

            it("should return true for a component wrapped by a single decorator", () => {
                const wrapper = decorateReactComponent({onEachElement: [hook]});

                const WrappedComp = wrapper(Comp);
                
                expect(decorationReflection.isDecorated(WrappedComp, wrapper)).to.equal(true);
            });

            it("should return true for a component wrapped by multiple specific decorators", () => {
                const wrapper = decorateReactComponent({onEachElement: [hook]});
                const wrapper2 = decorateReactComponent({onEachElement: [hook]});

                const WrappedComp = wrapper(Comp);
                const WrappedComp2 = wrapper2(WrappedComp);
                
                expect(decorationReflection.isDecorated(WrappedComp2, wrapper)).to.equal(true);
                expect(decorationReflection.isDecorated(WrappedComp2, wrapper2)).to.equal(true);
            });
            
            it("should fire a warning (in devMode only) when trying to double wrap with the same decorator", () => {
                const _warn = console.warn;
                console.warn = sinon.spy();

                runInContext({ devMode: true }, () => {
                    const wrapper = decorateReactComponent({onEachElement: [hook]});
                    
                    const WrappedComp = wrapper(Comp);
                    const WrappedComp2 = wrapper(WrappedComp);

                    expect(console.warn).to.have.been.calledOnce;
                    expect(console.warn).to.have.been.calledWith(WrappedComp2, sinon.match(/is already wrapped with/), wrapper);
                });
    
                console.warn = _warn;
            });

            it("should fire a warning (in devMode only) when trying to double wrap with the same decorator", () => {
                const _warn = console.warn;
                console.warn = sinon.spy();
                const wrapper = decorateReactComponent({onEachElement: [hook]});

                const WrappedComp = wrapper(Comp);
                const WrappedComp2 = wrapper(WrappedComp);

                expect(console.warn).to.not.have.been.called;
    
                console.warn = _warn;
            });
        }
    
        testWithBothComponentTypes(SFComp, suite);
    });
});
