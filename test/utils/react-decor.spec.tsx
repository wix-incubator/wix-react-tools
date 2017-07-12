import {registerForCreateElement} from "../../src/";
import * as React from "react";
import {renderToString} from "react-dom/server";
import {CreateElementNext, ElementType} from "../../src/";
import {ReactNode} from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {runInContext} from "../../src/utils/config";

describe('react-decor', () => {

    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());


    it('example', () => {
        function overrideClassesHook<P extends { className?: string }>(instance: React.Component<{ classOverride?: string }, any>,
                                                                       next: CreateElementNext<P>,
                                                                       type: ElementType<P>,
                                                                       props: P,
                                                                       children: Array<ReactNode>) {

            if (instance.props.classOverride) {
                props.className = instance.props.classOverride;
            }
            return next(type, props, ...children);
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
        expect(() => clientRenderer.render(<MyComp/>)).to.throw(Error, /(?=.*\@registerForCreateElement.*)(?=.*undefined.*)/);
    });

    it('cleans up hook even if render throws', () => {
        @registerForCreateElement((() => { throw new Error('weeeeeee!!');}) as any)
        class MyComp extends React.Component {
            render() {
                return <div/>
            }
        }
        // expect the error to have a message with these two strings: `@registerForCreateElement` , `undefined`
        expect(() => clientRenderer.render(<MyComp/>), 'render MyComp').to.throw(Error);
        expect(() => clientRenderer.render(<div/>), 'render after MyComp').not.to.throw(Error);
    });

    it('multiple hooks work together', () => {
        function FooHook<P extends { foo?: string }>(instance: React.Component,
                                                                       next: CreateElementNext<P>,
                                                                       type: ElementType<P>,
                                                                       props: P,
                                                                       children: Array<ReactNode>) {
            props.foo = 'foo';
            return next(type, props, ...children);
        }
        function BarHook<P extends { bar?: string }>(instance: React.Component,
                                                     next: CreateElementNext<P>,
                                                     type: ElementType<P>,
                                                     props: P,
                                                     children: Array<ReactNode>) {
            props.bar = 'bar';
            return next(type, props, ...children);
        }
        @registerForCreateElement(FooHook)
        @registerForCreateElement(BarHook)
        class MyComp extends React.Component {
            render() {
                return <div data-automation-id="1"/>
            }
        }
        const {select} = clientRenderer.render(<MyComp/>);
        expect(select('1')).to.have.property('foo', 'foo').and.to.have.property('bar', 'bar');
    });

    xit('old WIP example', () => {
        function hook<P extends { className?: string }>(instance: React.Component<any, any>,
                                                        next: CreateElementNext<P>,
                                                        type: ElementType<P>,
                                                        props: P,
                                                        children: Array<ReactNode>) {

            if (instance.props.className) {
                props.className = instance.props.className + (props.className ? ' ' + props.className : '');
            }
            return next(type, props, children);
        }

        @registerForCreateElement(hook)
        class MyComp extends React.Component<{ className: string }, {}> {
            render() {
                return <div className="rootClassName">
                    <div className="otherClassName"/>
                </div>
            }
        }

        renderToString(<MyComp className="App"/>)

// will return:
        /* <div className="App rootClassName">
         <div className="otherClassName"></div>
         </div>*/
    });
});
