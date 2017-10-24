import {devMode, overrideGlobalConfig, reactDecor, runInContext, stylable} from "../../src";
import {createGenerator, StateMap, Stylesheet} from "stylable";
import {ClientRenderer, expect} from "test-drive-react";
import * as React from "react";
import {inBrowser} from "mocha-plugin-env";
import {testWithBothComponentTypes} from "../test-drivers/test-tools";
import {ElementArgs} from "../../src/react-decor/common";

/**
 * this suite serves two purposes:
 * 1. test the integration of two popular features that are likely to be used together
 * 2. test feature composition in general
 */
describe.assuming(inBrowser(), 'only in browser')('@stylable with @onRootElement (regression)', () => {

    const {fromCSS} = createGenerator();
    const {runtime} = fromCSS(`
            .SomeClass {}
        `);
    beforeEach('cleanup', () => {
        overrideGlobalConfig(devMode.ON);
    });
    const clientRenderer = new ClientRenderer();
    afterEach(() => runInContext(devMode.OFF, () => clientRenderer.cleanup()));

    type Props = {
        byDecorator?: boolean,
        byRender?: boolean,
    }

    const comp: React.SFC<Props> = (p: Props) => (
        <div data-automation-id="Root" style-state={p.byRender ? {byRender: true} : {}}/>);

    function mergeStyleState(props: { ['style-state']: StateMap }, from: StateMap) {
        const to = props['style-state'] = props['style-state'] || {};
        Object.keys(from).forEach((stateName: string) => {
            to[stateName] = to[stateName] || from[stateName];
        });
    }

    function stateSelector(sheet: Stylesheet, states: StateMap) {
        const stateAttrs = sheet.cssStates(states);
        const selectWithState = Object.keys(stateAttrs).map((k) => `[${k}=${stateAttrs[k]}]`).join('');
        return selectWithState;
    }

    const customWrapper = reactDecor.onRootElement<Props>((props: Props, args: ElementArgs<any>) => {
        const styleState = {
            byDecorator: !!props.byDecorator,
            noRightBorderRadius: !!props.byRender
        };
        mergeStyleState(args.newProps, styleState);
        return args;
    });
    const stylableWrapper = stylable(runtime);
    const wrapper = (component: React.ComponentType<Props>) => stylableWrapper(customWrapper(component));

    function suite(component: React.ComponentType<Props>) {
        it('supports empty elements', () => {
            const Comp = wrapper(component);

            const {select, container} = clientRenderer.render(<Comp/>);

            expect(select('Root')).to.have.class(runtime.root);
            expect(select('Root')).to.have.attribute('class', runtime.root);
            expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
            expect(container.querySelectorAll(`.${runtime.root}${stateSelector(runtime.$stylesheet, {})}`)).to.have.length(1);
        });

        it('supports injecting style-state by onRootElement', () => {
            const Comp = wrapper(component);

            const {select, container} = clientRenderer.render(<Comp byDecorator={true}/>);

            expect(select('Root')).to.have.class(runtime.root);
            expect(select('Root')).to.have.attribute('class', runtime.root);
            expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
            expect(container.querySelectorAll(`.${runtime.root}${stateSelector(runtime.$stylesheet, {byDecorator: true})}`)).to.have.length(1);
        });

        it('supports injecting style-state by component', () => {
            const Comp = wrapper(component);

            const {select, container} = clientRenderer.render(<Comp byRender={true}/>);

            expect(select('Root')).to.have.class(runtime.root);
            expect(select('Root')).to.have.attribute('class', runtime.root);
            expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
            expect(container.querySelectorAll(`.${runtime.root}${stateSelector(runtime.$stylesheet, {byRender: true})}`)).to.have.length(1);
        });

        it('supports injecting style-state by onRootElement and component', () => {
            const Comp = wrapper(component);

            const {select, container} = clientRenderer.render(<Comp byDecorator={true} byRender={true}/>);

            expect(select('Root')).to.have.class(runtime.root);
            expect(select('Root')).to.have.attribute('class', runtime.root);
            expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
            expect(container.querySelectorAll(`.${runtime.root}${stateSelector(runtime.$stylesheet, {
                byDecorator: true,
                byRender: true
            })}`)).to.have.length(1);
        });
    }

    testWithBothComponentTypes(comp, suite);
});
