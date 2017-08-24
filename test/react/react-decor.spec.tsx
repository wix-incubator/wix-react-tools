import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { expect, ClientRenderer } from 'test-drive-react';
import { spyAll, resetAll } from '../test-drivers/test-tools';
import { inBrowser } from "mocha-plugin-env/dist/src";
import { ElementHook as SFCElementHook, ElementArgs as SFCElementArgs } from '../../src/react/react-decor-function';
import { onChildElement, onRootElement, ElementHook as ClassElementHook, ElementArgs as ClassElementArgs } from '../../src/react/react-decor-class';
import { Rendered } from '../../src/core/types';
import { decorateReactComponent } from '../../src/react/react-decorator'; // todo: implement

describe.assuming(inBrowser(), 'only in browser')('react-decor2', () => {
    const clientRenderer = new ClientRenderer();

    const console = spyAll({
        log: () => { }
    });

    afterEach("cleanup and reset console.log", () => {
        resetAll(console);
        clientRenderer.cleanup();
    });

    type PropsWithName = { name: string };

    describe('react stateless functional component', () => {
        const nodeHook: SFCElementHook<PropsWithName> = function (componentProps: PropsWithName, args: SFCElementArgs<any>): SFCElementArgs<any> {
            console.log(args.elementProps['data-automation-id']);
            return args;
        };
        const Comp: React.SFC<PropsWithName> = ({ name }) => (
            <div data-delete-me="TBDeleted" data-change-me="TBChanged">
                <span data-automation-id="content">
                    {name}
                </span>
            </div>
        );

        it('should wrap a react component, without any hooks', () => {
            const wrap = decorateReactComponent<PropsWithName, Rendered<any>>({});
            const WrappedComp = wrap(Comp);

            const { select } = clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only
            const content = select('content');

            expect(content).to.be.ok;
            expect((content as HTMLSpanElement).innerText).to.equal('Jon');
        });

        describe('node hooks', () => {
            it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
                const wrap = decorateReactComponent({ nodes: [nodeHook] });
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon" />);

                expect(console.log).to.have.callCount(2);
                expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
                expect(console.log).to.have.been.calledWithMatch(/content/);
            });

            it('should allow adding multiple nodes hooks to a stateless react component', () => {
                const wrap = decorateReactComponent({ nodes: [nodeHook, nodeHook] });
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon" />);

                expect(console.log).to.have.callCount(4);
                expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
                expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
            });

            it('should allow adding a node hook to a stateless component that will add/remove/change the element props', () => {
                let index = 0;
                function multiActionNodeHook(componentProps: PropsWithName, args: SFCElementArgs<any>): SFCElementArgs<any> {
                    args.elementProps['data-automation-id'] = index;
                    args.elementProps['data-change-me'] = componentProps.name + index;
                    args.elementProps['data-delete-me'] = undefined;
                    index++;
                    return args;
                }

                const wrap = decorateReactComponent({ nodes: [multiActionNodeHook] });
                const WrappedComp = wrap(Comp);

                const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

                expect(select('0')).to.be.ok; // add attribute
                expect(select('1')).to.be.ok;
                expect(select('0')).to.not.have.attribute('data-delete-me'); // remove attribute
                expect(select('1')).to.not.have.attribute('data-delete-me');
                expect(select('0')).to.have.attribute('data-change-me', 'Jon0'); // change/add attribute
                expect(select('1')).to.have.attribute('data-change-me', 'Jon1');
            });
        });

        describe('root hooks', () => {
            function rootHook(componentProps: PropsWithName, args: SFCElementArgs<any>): SFCElementArgs<any> {
                args.elementProps['data-automation-id'] = 'root';
                args.elementProps['data-change-me'] = componentProps.name;
                args.elementProps['data-delete-me'] = undefined;
                return args;
            }

            it('should allow adding a single root hook to a stateless component that will add/remove/change the root elements props', () => {
                const wrap = decorateReactComponent({ root: [rootHook] });
                const WrappedComp = wrap(Comp);

                const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

                expect(select('root')).to.be.ok;
                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
            });
        });
    });

    describe('react class component', () => {
        const nodeHook1: ClassElementHook<Rendered<PropsWithName>> = function (instance: Rendered<PropsWithName>, args: ClassElementArgs<any>): ClassElementArgs<any> {
            console.log(args.props['data-automation-id']);
            return args;
        };
        const nodeHook2: ClassElementHook<Rendered<PropsWithName>> = function (instance: Rendered<PropsWithName>, args: ClassElementArgs<any>): ClassElementArgs<any> {
            console.log(args.props['data-automation-id']);
            return args;
        };

        class Comp extends React.Component<PropsWithName> {
            render() {
                return (
                    <div data-delete-me="TBDeleted" data-change-me="TBChanged">
                        <span data-automation-id="content">
                            {this.props.name}
                        </span>
                    </div>
                )
            }
        }

        it('should wrap a react component, without any hooks', () => {
            const wrap = decorateReactComponent<PropsWithName, Rendered<PropsWithName>>({}, {});
            const WrappedComp = wrap(Comp);

            const { select } = clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only
            const content = select('content');

            expect(content).to.be.ok;
            expect((content as HTMLSpanElement).innerText).to.equal('Jon');
        });

        describe('node hooks', () => {
            it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
                const wrap = decorateReactComponent<PropsWithName, Rendered<PropsWithName>>({}, { nodes: [nodeHook1] });
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon" />);

                expect(console.log).to.have.callCount(2);
                expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
                expect(console.log).to.have.been.calledWithMatch(/content/);
            });

            it('should allow adding multiple nodes hooks to a stateless react component', () => {
                const wrap = decorateReactComponent<PropsWithName>({}, { nodes: [nodeHook1, nodeHook2] });
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon" />);

                expect(console.log).to.have.callCount(4);
                expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
                expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
            });

            it('should allow adding a node hook to a stateless component that will add/remove/change the element props', () => {
                let index = 0;
                function multiActionNodeHook(instance: Rendered<PropsWithName>, args: ClassElementArgs<any>): ClassElementArgs<any> {
                    args.props['data-automation-id'] = index;
                    args.props['data-change-me'] = instance.props.name + index;
                    args.props['data-delete-me'] = undefined;
                    index++;
                    return args;
                }

                const wrap = decorateReactComponent<PropsWithName>({}, { nodes: [multiActionNodeHook] });
                const WrappedComp = wrap(Comp);

                const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

                expect(select('0')).to.be.ok; // add attribute
                expect(select('1')).to.be.ok;
                expect(select('0')).to.not.have.attribute('data-delete-me'); // remove attribute
                expect(select('1')).to.not.have.attribute('data-delete-me');
                expect(select('0')).to.have.attribute('data-change-me', 'Jon0'); // change/add attribute
                expect(select('1')).to.have.attribute('data-change-me', 'Jon1');
            });
        });

        describe('root hooks', () => {
            function rootHook(instance: Rendered<PropsWithName>, args: ClassElementArgs<any>): ClassElementArgs<any> {
                args.props['data-automation-id'] = 'root';
                args.props['data-change-me'] = instance.props.name;
                args.props['data-delete-me'] = undefined;
                return args;
            }

            it('should allow adding a single root hook to a stateless component that will add/remove/change the root elements props', () => {
                const wrap = decorateReactComponent<PropsWithName>({}, { root: [rootHook] });
                const WrappedComp = wrap(Comp);

                const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

                expect(select('root')).to.be.ok;
                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
            });
        });
    });

});
