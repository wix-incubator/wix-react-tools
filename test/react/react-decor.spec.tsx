import {ElementArgs, onChildElement, onRootElement} from "../../src";
import * as React from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";

declare const process: any;
function inProduction() {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV === 'production';
    }
    return false;
}

describe.assuming(inBrowser(), 'only in browser')('react-decor', () => {
    describe.assuming(inProduction(), 'only in production mode')('react contract regression tests', () => {
        it('in production mode', () => {
            // This test either passes or is ignored. It's here as a log artifact, to know whether other tests run in production mode
            expect(process.env.NODE_ENV).to.eql('production');
        });
    });
    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    describe('example', () => {
        function overrideClassesHook<P extends { className?: string }>(instance: React.Component<{ classOverride?: string }, any>, args: ElementArgs<P>) {
            if (instance.props.classOverride) {
                args.props.className = instance.props.classOverride;
            }
            return args;
        }
        class SuperComp extends React.Component<{ classOverride: string }, {}> {
            render() {
                return <div data-automation-id="Root" className="rootClassName">
                    <div data-automation-id="Child" className="otherClassName"/>
                </div>
            }
        }

        it('onRootElement', () => {
            @onRootElement(overrideClassesHook)
            class MyComp extends SuperComp{}

            const {select} = clientRenderer.render(<MyComp classOverride="App"/>);
            expect(select('Root')).to.have.property('className', 'App');
            expect(select('Child')).to.have.property('className', 'otherClassName');
        });
        it('onChildElement', () => {
            @onChildElement(overrideClassesHook)
            class MyComp extends SuperComp{}

            const {select} = clientRenderer.render(<MyComp classOverride="App"/>);
            expect(select('Root')).to.have.property('className', 'App');
            expect(select('Child')).to.have.property('className', 'App');
        });
    });
    describe('onChildElement', () => {
        it('throws when hook returns undefined', () => {
            @onChildElement((() => {
            }) as any)
            class MyComp extends React.Component {
                render() {
                    return <div/>
                }
            }
            // expect the error to have a message with these strings: `onChildElement` , `hook`, `undefined`
            expect(
                () => clientRenderer.render(<MyComp/>)
            ).to.throw(Error, /(?=.*onChildElement.*)(?=.*hook.*)(?=.*undefined.*)/);
        });

        it('cleans up hook even if render throws', () => {
            @onChildElement((() => {
                throw new Error('weeeeeee!!');
            }) as any)
            class MyComp extends React.Component {
                render() {
                    return <div/>
                }
            }
            // expect the error to have a message with these two strings: `@onChildElement` , `undefined`
            expect(() => clientRenderer.render(<MyComp/>), 'render MyComp').to.throw(Error, 'weeeeeee');
            expect(() => clientRenderer.render(<div/>), 'render after MyComp').not.to.throw(Error);
        });

        it('multiple hooks work together', () => {
            function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, args: ElementArgs<P>) {
                args.props['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, args: ElementArgs<P>) {
                args.props['data-bar'] = 'bar';
                return args;
            }

            @onChildElement(FooHook)
            @onChildElement(BarHook)
            class MyComp extends React.Component {
                render() {
                    return <div data-automation-id="1"/>
                }
            }
            const {select} = clientRenderer.render(<MyComp/>);
            expect(select('1')).to.have.attribute('data-foo', 'foo');
            expect(select('1')).to.have.attribute('data-bar', 'bar');
        });

        it('multiple hooks work together on multiple levels', () => {
            function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, args: ElementArgs<P>) {
                args.props['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, args: ElementArgs<P>) {
                args.props['data-bar'] = 'bar';
                return args;
            }

            @onChildElement(FooHook)
            class BaseComp extends React.Component {

            }

            @onChildElement(BarHook)
            class MyComp extends BaseComp {
                render() {
                    return <div data-automation-id="1"/>
                }
            }
            const {select} = clientRenderer.render(<MyComp/>);
            expect(select('1')).to.have.attribute('data-foo', 'foo');
            expect(select('1')).to.have.attribute('data-bar', 'bar');
        });
    });
});
