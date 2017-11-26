import * as React from "react";
import {Component, HTMLAttributes} from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {inBrowser} from "mocha-plugin-env";
import {ElementArgs, reactDecor, StatefulElementHook} from "../../src";

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
        args.newProps['data-foo'] = 'foo';
        return args;
    }

    function barHook<P extends { ['data-bar']?: string } & HTMLAttributes<HTMLElement>>(_props: object, args: ElementArgs<P>) {
        args.newProps['data-bar'] = 'bar';
        return args;
    }

    const fooDecorator = reactDecor.onEachElement(fooHook);
    const barDecorator = reactDecor.onEachElement(barHook);

    it('multiple hooks work together', () => {
        @fooDecorator
        @barDecorator
        class MyComp extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        expect(reactDecor.isDecorated(MyComp)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, barDecorator)).to.eql(true);
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

        expect(reactDecor.isDecorated(MyComp)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });

    it('works also when render method is wrapped', () => {
        @fooDecorator
        @barDecorator
        class Parent extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }

        class MyComp extends Parent {
            constructor(p:any) {
                super(p);
                this.render = this.render.bind(this);
            }
        }

        expect(reactDecor.isDecorated(MyComp)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });

    it('works also with SFC that is wrapped by a class', () => {
        const Sfc =
            fooDecorator(
                barDecorator(
                    function Sfc(props: any) {
                        return <div data-automation-id="1"/>
                    }));


        class MyComp extends React.Component {
            render(){
                return Sfc.apply(this, [this.props]);
            }
        }

        // I dont think it's possible to support this
        // expect(reactDecor.isDecorated(MyComp)).to.eql(true);
        // expect(reactDecor.isDecorated(MyComp, fooDecorator)).to.eql(true);
        // expect(reactDecor.isDecorated(MyComp, barDecorator)).to.eql(true);
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

        expect(reactDecor.isDecorated(Parent)).to.eql(true);
        expect(reactDecor.isDecorated(Parent, fooDecorator)).to.eql(true);
        expect(reactDecor.isDecorated(Parent, barDecorator)).to.eql(false);

        expect(reactDecor.isDecorated(MyComp)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, fooDecorator)).to.eql(true);
        expect(reactDecor.isDecorated(MyComp, barDecorator)).to.eql(true);
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.attribute('data-foo', 'foo');
        expect(select('1')).to.have.attribute('data-bar', 'bar');
    });


    describe('stateful hooks', () => {
        type PropsWithName = { name: string };

        class ClassComp extends Component<PropsWithName> {
            foo = 'foo!';
            bar = 'bar!';

            render() {
                return <div data-automation-id="root" data-delete-me="TBDeleted" data-change-me="TBChanged">
                    <span data-automation-id="content" data-delete-me="TBDeleted" data-change-me="TBChanged">
                        {name}
                    </span>
                </div>;
            }
        }

        const statefulHook: StatefulElementHook<PropsWithName, ClassComp> = function (this: ClassComp, componentProps: PropsWithName, args: ElementArgs<any>, isRoot: boolean): ElementArgs<any> {
            if (isRoot) {
                args.newProps['data-foo'] = this.foo;
            } else {
                args.newProps['data-bar'] = this.bar;
            }
            return args;
        };

        it('has access to component instance as well as to elements', () => {
            const wrap = reactDecor.makeFeature([], [statefulHook]);
            const WrappedComp = wrap(ClassComp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);
            expect(select('root')).to.have.attribute('data-foo', 'foo!');
            expect(select('content')).to.have.attribute('data-bar', 'bar!');
        });

    });

});
