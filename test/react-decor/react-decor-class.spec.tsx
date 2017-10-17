import * as React from "react";
import {HTMLAttributes} from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {ElementArgs, onEachElement} from "../../src";

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

    it('multiple hooks work together', () => {
        function FooHook<P extends { ['data-foo']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
            args.elementProps['data-foo'] = 'foo';
            return args;
        }

        function BarHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
            args.elementProps['data-bar'] = 'bar';
            return args;
        }

        @onEachElement(FooHook)
        @onEachElement(BarHook)
        class MyComp extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });


    it('inheritance works', () => {
        function FooHook<P extends { ['data-foo']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
            args.elementProps['data-foo'] = 'foo';
            return args;
        }

        function BarHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
            args.elementProps['data-bar'] = 'bar';
            return args;
        }

        @onEachElement(FooHook)
        @onEachElement(BarHook)
        class Parent extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        class MyComp extends Parent {

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


        @onEachElement(FooHook)
        class BaseComp extends React.Component {

        }

        @onEachElement(BarHook)
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
