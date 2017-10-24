import {inBrowser} from "mocha-plugin-env";
import * as React from "react";
import {SFC} from "react";
import {asRootOnly, devMode, ElementArgs, reactDecor, resetReactMonkeyPatches, runInContext} from "../../src";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {testWithBothComponentTypes} from "../test-drivers/test-tools";

type PropsWithName = { name: string };

function addChangeRemoveHook(componentProps: PropsWithName, args: ElementArgs<any>) {
    args.newProps['data-add-me'] = componentProps.name;
    args.newProps['data-change-me'] = componentProps.name;
    args.newProps['data-delete-me'] = undefined;
}

describe.assuming(inBrowser(), 'only in browser')('react-decorator', () => {

    beforeEach(resetReactMonkeyPatches);
    const clientRenderer = new ClientRenderer();

    describe('react decoration warnings', () => {
        let warn = console.warn;
        beforeEach("replace fakeConsole.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset fakeConsole.warn", () => {
            console.warn = warn;
        });

        const result = <div/>;
        const Comp: SFC<PropsWithName> = () => result;
        const CompReturnsNull: SFC<PropsWithName> = () => null;

        function nullTest(Comp: any) {
            it('does not warn on unknown root if null', () => {
                runInContext(devMode.ON, () => {
                    const wrap = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
                    const WrappedComp = wrap(Comp);
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(console.warn).to.have.callCount(0);
                });
            });
        }

        testWithBothComponentTypes(CompReturnsNull, nullTest);

        function suite(Comp: any) {
            const wrap = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
            const WrappedComp = wrap(Comp);
            it('warns on unknown root in dev mode', () => {
                runInContext(devMode.ON, () => {
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(console.warn).to.have.callCount(1);
                    expect(console.warn).to.have.been.calledWithMatch(/unexpected root/);
                });
            });

            it('does not warn on unknown root out of dev mode', () => {
                runInContext(devMode.OFF, () => {
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(console.warn).to.have.callCount(0);
                });
            });
        }

        testWithBothComponentTypes(Comp, suite);
    });

});
