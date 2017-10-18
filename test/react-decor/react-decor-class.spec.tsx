import * as React from "react";
import {HTMLAttributes} from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {ElementArgs, onEachElement} from "../../src";
import {reactDecor} from "../../src/react-decor/logic";

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


    function fooHook<P extends { ['data-foo']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
        args.elementProps['data-foo'] = 'foo';
        return args;
    }

    function barHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
        args.elementProps['data-bar'] = 'bar';
        return args;
    }

    const fooDecorator = onEachElement(fooHook);
    const barDecorator = onEachElement(barHook);

    it('multiple hooks work together', () => {
        @fooDecorator
        @barDecorator
        class MyComp extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        expect(reactDecor.isWrapped(MyComp)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });


    it('inheritance works', () => {
        @fooDecorator
        @barDecorator
        class Parent extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        class MyComp extends Parent {

        }

        expect(reactDecor.isWrapped(MyComp)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });

    it('multiple hooks work together on multiple levels', () => {
        @fooDecorator
        class Parent extends React.Component {

        }

        @barDecorator
        class MyComp extends Parent {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        expect(reactDecor.isWrapped(Parent)).to.eql(true);
        expect(reactDecor.isWrapped(Parent, fooDecorator)).to.eql(true);
        expect(reactDecor.isWrapped(Parent, barDecorator)).to.eql(false);

        expect(reactDecor.isWrapped(MyComp)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isWrapped(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });
});
