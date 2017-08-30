import {onChildElement, onRootElement, simulateRender} from "../../src/react-decor/react-decor-class";
import {ElementArgs} from "../../src/react-decor/common";
import * as React from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {runInContext} from "../../src/core/config";
import {GlobalConfig} from "../../src/core/types";

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
        function overrideClassesHook<P extends { className?: string }>(instance: React.Component<{ classOverride?: string }, any>, props: { classOverride?: string }, args: ElementArgs<P>) {
            if (instance.props.classOverride) {
                args.elementProps.className = instance.props.classOverride;
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
            class MyComp extends SuperComp {
            }

            const {select} = clientRenderer.render(<MyComp classOverride="App"/>);
            expect(select('Root')).to.have.property('className', 'App');
            expect(select('Child')).to.have.property('className', 'otherClassName');
        });
        it('onChildElement', () => {
            @onChildElement(overrideClassesHook)
            class MyComp extends SuperComp {
            }

            const {select} = clientRenderer.render(<MyComp classOverride="App"/>);
            expect(select('Root')).to.have.property('className', 'App');
            expect(select('Child')).to.have.property('className', 'App');
        });
    });
    describe('onRootElement', () => {
        let warn = console.warn;
        beforeEach("replace console.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            console.warn = warn;
        });

        const result = <div data-automation-id="Root"/>;

        function justAHook(_: React.Component, props: object, args: ElementArgs<any>) {
            return args;
        }

        @onRootElement(justAHook)
        class MyComp extends React.Component {
            render() {
                return result;
            }
        }
        it('warns on unknown root in dev mode', () => {
            runInContext<GlobalConfig>({devMode: true}, () => {
                simulateRender(MyComp);
                expect(console.warn).to.have.callCount(1);
                expect(console.warn).to.have.been.calledWithMatch(/unexpected root/);
            });
        });

        it('does not warn on unknown root out of dev mode', () => {
            runInContext<GlobalConfig>({devMode: false}, () => {
                simulateRender(MyComp);
                expect(console.warn).to.have.callCount(0);
            });
        });
        it('does not warn on unknown root if null', () => {
            runInContext<GlobalConfig>({devMode: true}, () => {
                @onRootElement(justAHook)
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
            runInContext<GlobalConfig>({devMode: false}, () => {
                new MyComp().render();
                expect(console.warn).to.have.callCount(0);
            });
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
            function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, props: object, args: ElementArgs<P>) {
                args.elementProps['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, props: object, args: ElementArgs<P>) {
                args.elementProps['data-bar'] = 'bar';
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
            function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, props: object, args: ElementArgs<P>) {
                args.elementProps['data-foo'] = 'foo';
                return args;
            }

            function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, props: object, args: ElementArgs<P>) {
                args.elementProps['data-bar'] = 'bar';
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
