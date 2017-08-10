import {CreateElementArgs, registerForCreateElement} from "../../src";
import * as React from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";

declare const process:any;
function inProduction(){
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

    it('example', () => {
        function overrideClassesHook<P extends { className?: string }>(instance: React.Component<{ classOverride?: string }, any>, args: CreateElementArgs<P>) {
            if (instance.props.classOverride) {
                args.props.className = instance.props.classOverride;
            }
            return args;
        }

        @registerForCreateElement(overrideClassesHook)
        class MyComp extends React.Component<{ classOverride: string }, {}> {
            render() {
                return <div data-automation-id="1" className="rootClassName">
                    <div data-automation-id="2" className="otherClassName"/>
                </div>
            }
        }
        const {select} = clientRenderer.render(<MyComp classOverride="App"/>);
        expect(select('1')).to.have.property('className', 'App');
        expect(select('2')).to.have.property('className', 'App');
    });

    it('throws when hook returns undefined', () => {
        @registerForCreateElement((() => {
        }) as any)
        class MyComp extends React.Component {
            render() {
                return <div/>
            }
        }
        // expect the error to have a message with these two strings: `@registerForCreateElement` , `undefined`
        expect(
            () => clientRenderer.render(<MyComp/>)
        ).to.throw(Error, /(?=.*\@registerForCreateElement.*)(?=.*undefined.*)/);
    });

    it('cleans up hook even if render throws', () => {
        @registerForCreateElement((() => {
            throw new Error('weeeeeee!!');
        }) as any)
        class MyComp extends React.Component {
            render() {
                return <div/>
            }
        }
        // expect the error to have a message with these two strings: `@registerForCreateElement` , `undefined`
        expect(() => clientRenderer.render(<MyComp/>), 'render MyComp').to.throw(Error, 'weeeeeee');
        expect(() => clientRenderer.render(<div/>), 'render after MyComp').not.to.throw(Error);
    });

    it('multiple hooks work together', () => {
        function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, args: CreateElementArgs<P>) {
            args.props['data-foo'] = 'foo';
            return args;
        }

        function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, args: CreateElementArgs<P>) {
            args.props['data-bar'] = 'bar';
            return args;
        }

        @registerForCreateElement(FooHook)
        @registerForCreateElement(BarHook)
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
        function FooHook<P extends { ['data-foo']?: string }>(instance: React.Component, args: CreateElementArgs<P>) {
            args.props['data-foo'] = 'foo';
            return args;
        }

        function BarHook<P extends { ['data-bar']?: string }>(instance: React.Component, args: CreateElementArgs<P>) {
            args.props['data-bar'] = 'bar';
            return args;
        }

        @registerForCreateElement(FooHook)
        class BaseComp extends React.Component {

        }

        @registerForCreateElement(BarHook)
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
