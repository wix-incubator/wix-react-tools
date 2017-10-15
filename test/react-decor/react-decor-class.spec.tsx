import {decorReactClass, simulateRender} from "../../src/react-decor/react-decor-class";
import * as React from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {devMode, runInContext, ElementArgs} from "../../src";
import {HTMLAttributes} from "react";
import {resetReactCreateElement} from "../../src/react-decor/common";
import {elementHooks} from "../../src/react-decor/index";

declare const process: any;
function inProduction() {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV === 'production';
    }
    return false;
}

describe.assuming(inBrowser(), 'only in browser')('react-decor-class', () => {
    describe.assuming(inProduction(), 'only in production mode')('react contract regression tests', () => {
        it('in production mode', () => {
            // This test either passes or is ignored. It's here as a log artifact, to know whether other tests run in production mode
            expect(process.env.NODE_ENV).to.eql('production');
        });
    });
    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    describe('example', () => {
        function overrideClassesHook<P extends { className?: string }>(this: React.Component<{ classOverride?: string }, any>, props: { classOverride?: string }, args: ElementArgs<P>) {
            if (this.props.classOverride) {
                args.elementProps.className = this.props.classOverride;
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
    });
    describe('onRootElement hooks', () => {
        let warn = console.warn;
        beforeEach("replace console.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            console.warn = warn;
        });

        const result = <div data-automation-id="Root"/>;

        function justAHook(_props: object, args: ElementArgs<any>) {
            return args;
        }

        @decorReactClass(elementHooks(null, [justAHook]))
        class MyComp extends React.Component {
            render() {
                return result;
            }
        }
        it('warns on unknown root in dev mode', () => {
            runInContext(devMode.ON, () => {
                simulateRender(MyComp);
                expect(console.warn).to.have.callCount(1);
                expect(console.warn).to.have.been.calledWithMatch(/unexpected root/);
            });
        });

        it('does not warn on unknown root out of dev mode', () => {
            runInContext(devMode.OFF, () => {
                simulateRender(MyComp);
                expect(console.warn).to.have.callCount(0);
            });
        });
        it('does not warn on unknown root if null', () => {
            runInContext(devMode.ON, () => {
                @decorReactClass(elementHooks(null, [justAHook]))
                class MyComp2 extends React.Component {
                    render() {
                        return null;
                    }
                }
                simulateRender(MyComp2);
                expect(console.warn).to.have.callCount(0);
            });
        });
        it('ignores unknown root out of dev mode', () => {
            runInContext(devMode.OFF, () => {
                new MyComp().render();
                expect(console.warn).to.have.callCount(0);
            });
        });

    });

    describe('onEachElement hooks', () => {
        beforeEach(resetReactCreateElement)

        it('throws when hook returns undefined', () => {
            @decorReactClass(elementHooks(null, [(() => {}) as any]))
            class MyComp extends React.Component {
                render() {
                    return <div/>
                }
            }
            // expect the error to have a message with these strings: `onChildElement` , `hook`, `undefined`
            expect(
                () => clientRenderer.render(<MyComp/>)
            ).to.throw(Error, /(?=.*onEachElement.*)(?=.*hook.*)(?=.*undefined.*)/);
        });

        it('multiple hooks work together', () => {
            function FooHook<P extends { ['data-foo']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
                args.elementProps['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
                args.elementProps['data-bar'] = 'bar';
                return args;
            }

            @decorReactClass(elementHooks(null, [FooHook]))
            @decorReactClass(elementHooks(null, [BarHook]))
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
            function FooHook<P extends { ['data-foo']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
                args.elementProps['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
                args.elementProps['data-bar'] = 'bar';
                return args;
            }


            @decorReactClass(elementHooks(null, [FooHook]))
            class BaseComp extends React.Component {

            }

            @decorReactClass(elementHooks(null, [BarHook]))
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
