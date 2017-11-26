import {reactDecor, stylable} from "../../src";
import {createGenerator} from "stylable";
import {ClientRenderer, expect} from "test-drive-react";
import * as React from "react";
import {inBrowser} from "mocha-plugin-env";
import {runInContext} from "../../src/core/config";
import {devMode} from "../../src/core/dev-mode";

describe.assuming(inBrowser(), 'only in browser')('stylable-fragment-react', () => {

    const clientRenderer = new ClientRenderer();
    afterEach(() => runInContext(devMode.OFF, () => clientRenderer.cleanup()));

    const {fromCSS} = createGenerator();
    const {runtime} = fromCSS(`
        .SomeClass {}
    `);

    it('supports props as children as per #198', () => {
        interface Props {
            name: string;
            children: (name: string) => JSX.Element;
        }

        const ChildrenAsFunction: React.SFC<Props> = ({name, children}) =>
            children('Hello ' + name);

        const AppWithChildrenAsFunction: React.SFC = stylable(runtime)(() => (
            <div>
                <ChildrenAsFunction name="React">
                    {stylable.fragment(runtime)((name: string) => <div data-automation-id="Node"
                                                                       className="SomeClass">{name}</div>)}
                </ChildrenAsFunction>
            </div>
        ));
        const {select} = clientRenderer.render(<AppWithChildrenAsFunction/>);
        expect(select('Node')).to.have.class(runtime.SomeClass);
    });

    it('supports empty elements', () => {
        @stylable.fragment(runtime)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root">
                    <div data-automation-id="Node"/>
                </div>
            }
        }

        const {container} = clientRenderer.render(<Comp> </Comp>);

        expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(0);
    });

    it('supports class names', () => {
        @stylable.fragment(runtime)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root">
                    <div data-automation-id="Node" className="SomeClass External"/>
                </div>
            }
        }

        const {select, container} = clientRenderer.render(<Comp> </Comp>);

        expect(container.querySelectorAll(`.${runtime.root}`)).to.have.length(0);
        expect(select('Node')).to.have.class(runtime.SomeClass);
        expect(select('Node')).to.have.class('External');
        expect(container.querySelectorAll(`.${runtime.SomeClass}`)).to.have.length(1);
    });

    describe('style state', () => {
        const {fromCSS} = createGenerator();
        const {runtime} = fromCSS(`
            .SomeClass {
                -st-state:x,y;
            }
        `);

        const nodeState = {x: true, y: false};
        const nodeStateAttrName = Object.keys(runtime.$stylesheet.cssStates(nodeState))[0];

        it('supported', () => {
            @stylable.fragment(runtime)
            class Comp extends React.Component {
                render() {
                    return <div data-automation-id="Root" style-state={nodeState}>
                        <div data-automation-id="Node" className="SomeClass" style-state={nodeState}/>
                    </div>
                }
            }

            const {select} = clientRenderer.render(<Comp> </Comp>);

            expect(select('Root')).to.have.attribute(nodeStateAttrName);
            expect(select('Node')).to.have.attribute(nodeStateAttrName);
            expect(new Comp().render().props).to.not.haveOwnProperty('cssState'); // delete original cssStates from render result
            expect(new Comp().render().props.children.props).to.not.haveOwnProperty('cssState'); // delete original cssStates from render result

        });

        it('cleans up original property', () => {
            @stylable.fragment(runtime)
            class Comp extends React.Component {
                render() {
                    return <div style-state={nodeState}/>
                }
            }

            const rootElement = new Comp().render();
            expect(rootElement && rootElement.props).to.not.have.property('style-state');
        });
    });

    describe('decoration', () => {
        @stylable.fragment(runtime)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root"/>
            }
        }

        it('should return true when checking isDecorated on a component decorated with stylable', () => {
            expect(reactDecor.isDecorated(Comp), 'isDecorated(Comp)').to.equal(true);
            expect(reactDecor.isDecorated(Comp, stylable), 'isDecorated(Comp, stylable)').to.equal(true);
            expect(reactDecor.isDecorated(Comp, stylable.fragment), 'isDecorated(Comp, stylable.fragment)').to.equal(true);
        });
    });
});
