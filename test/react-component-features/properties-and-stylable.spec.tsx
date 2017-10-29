import {properties, stylable} from "../../src";
import {createGenerator} from "stylable";
import {ClientRenderer, expect} from "test-drive-react";
import * as React from "react";
import {inBrowser} from "mocha-plugin-env";
import {testWithBothComponentTypes} from "../test-drivers/test-tools";
import {runInContext} from "../../src/core/config";
import {devMode} from "../../src/core/dev-mode";

/**
 * this suite serves two purposes:
 * 1. test the integration of two popular features that are likely to be used together
 * 2. test feature composition in general
 */
describe.assuming(inBrowser(), 'only in browser')('@stylable with @properties (regression)', () => {
    const {fromCSS} = createGenerator();
    const {runtime} = fromCSS(`
            .SomeClass {}
        `);

    const clientRenderer = new ClientRenderer();
    afterEach(() => runInContext(devMode.OFF, () => clientRenderer.cleanup()));

    const comp: React.SFC<properties.Props> = (p: properties.Props) => (<div/>);

    const stylableWrapper = stylable(runtime);
    const wrapper = (component: React.ComponentType<properties.Props>) => stylableWrapper(properties(component));
    const wrapper2 = (component: React.ComponentType<properties.Props>) => properties(stylableWrapper(component)); // same as wrapper, in reverse order


    const suite = (wrapper: (component: React.ComponentType<properties.Props>) => React.ComponentType<properties.Props>) =>
        (component: React.ComponentType<properties.Props>) => {
            it('supports empty elements', () => {
                const Comp = wrapper(component);

                const {select, container} = clientRenderer.render(<Comp data-automation-id="Root"> </Comp>);

                expect(select('Root')).to.have.class(runtime.root);
                expect(select('Root')).to.have.attribute('class', runtime.root);
                expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
            });

            it('supports class names', () => {
                const Comp = wrapper(component);

                const {select, container} = clientRenderer.render(<Comp data-automation-id="Root"
                                                                        className="SomeClass External"> </Comp>);

                expect(select('Root')).to.have.class(runtime.root);
                expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(1);
                expect(select('Root')).to.have.class(runtime.SomeClass);
                expect(select('Root')).to.have.class('External');
                expect(container.querySelectorAll(`.${runtime.SomeClass}`)).to.have.length(1);
            });
        };


    testWithBothComponentTypes(comp, suite(wrapper));
    describe('reverse order', () => {
        testWithBothComponentTypes(comp, suite(wrapper2));
    });
});
