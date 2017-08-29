import * as React from "react";
import {ClientRenderer, expect} from "test-drive-react";
import {resetAll, spyAll} from "../test-drivers/test-tools";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {ElementArgs, Rendered, StatefulElementHook, StatelessElementHook} from "../../src/react-decor/common";
import {decorateReactComponent} from "../../src/react-decor";

describe.assuming(inBrowser(), 'only in browser')('react-decor2', () => {
    const clientRenderer = new ClientRenderer();

    const console = spyAll({
        log: () => {
        }
    });

    afterEach("cleanup and reset console.log", () => {
        resetAll(console);
        clientRenderer.cleanup();
    });

    type PropsWithName = { name: string };

    describe('react stateless functional component', () => {
        const Comp: React.SFC<PropsWithName> = ({name}) => (
            <div data-delete-me="TBDeleted" data-change-me="TBChanged">
                <span data-automation-id="content">
                    {name}
                </span>
            </div>
        );
        const elementHook: StatelessElementHook<PropsWithName> = function (instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            console.log(args.elementProps['data-automation-id']);
            return args;
        };

        it('should wrap a react component, without any hooks', () => {
            const wrap = decorateReactComponent<PropsWithName, Rendered<any>>({});
            const WrappedComp = wrap(Comp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>); // todo: maybe fix currently client only
            const content = select('content');

            expect(content).to.be.ok;
            expect((content as HTMLSpanElement).innerText).to.equal('Jon');
        });

        describe('node hooks', () => {
            it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
                const wrap = decorateReactComponent({onEachElement: [elementHook]});
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(console.log).to.have.callCount(2);
                expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
                expect(console.log).to.have.been.calledWithMatch(/content/);
            });

            it('should allow adding multiple nodes hooks to a stateless react component', () => {
                const wrap = decorateReactComponent({onEachElement: [elementHook, elementHook]});
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(console.log).to.have.callCount(4);
                expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
                expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
            });

            it('should allow adding a node hook to a stateless component that will add/remove/change the element props', () => {
                let index = 0;

                function multiActionElementHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                    args.elementProps['data-automation-id'] = index;
                    args.elementProps['data-change-me'] = componentProps.name + index;
                    args.elementProps['data-delete-me'] = undefined;
                    index++;
                    return args;
                }

                const wrap = decorateReactComponent({onEachElement: [multiActionElementHook]});
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('0')).to.be.ok; // add attribute
                expect(select('1')).to.be.ok;
                expect(select('0')).to.not.have.attribute('data-delete-me'); // remove attribute
                expect(select('1')).to.not.have.attribute('data-delete-me');
                expect(select('0')).to.have.attribute('data-change-me', 'Jon0'); // change/add attribute
                expect(select('1')).to.have.attribute('data-change-me', 'Jon1');
            });
        });

        describe('root hooks', () => {
            function rootHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                args.elementProps['data-automation-id'] = 'root';
                args.elementProps['data-change-me'] = componentProps.name;
                args.elementProps['data-delete-me'] = undefined;
                return args;
            }

            it('should allow adding a single root hook to a stateless component that will add/remove/change the root elements props', () => {
                const wrap = decorateReactComponent({onRootElement: [rootHook]});
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('root')).to.be.ok;
                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
            });
        });
    });

    describe('react class component', () => {
        const elementHook1: StatefulElementHook<PropsWithName> = function (instance: Rendered<PropsWithName>, props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            console.log(args.elementProps['data-automation-id']);
            return args;
        };
        const elementHook2: StatefulElementHook<PropsWithName> = function (instance: Rendered<PropsWithName>, props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            console.log(args.elementProps['data-automation-id']);
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

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>); // todo: maybe fix currently client only
            const content = select('content');

            expect(content).to.be.ok;
            expect((content as HTMLSpanElement).innerText).to.equal('Jon');
        });

        describe('node hooks', () => {
            it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
                const wrap = decorateReactComponent<PropsWithName, Rendered<PropsWithName>>({}, {onEachElement: [elementHook1]});
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(console.log).to.have.callCount(2);
                expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
                expect(console.log).to.have.been.calledWithMatch(/content/);
            });

            it('should allow adding multiple nodes hooks to a stateless react component', () => {
                const wrap = decorateReactComponent<PropsWithName>({}, {onEachElement: [elementHook1, elementHook2]});
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(console.log).to.have.callCount(4);
                expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
                expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
            });

            it('should allow adding a node hook to a stateless component that will add/remove/change the element props', () => {
                let index = 0;

                function multiActionNodeHook(instance: Rendered<PropsWithName>, props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                    args.elementProps['data-automation-id'] = index;
                    args.elementProps['data-change-me'] = instance.props.name + index;
                    args.elementProps['data-delete-me'] = undefined;
                    index++;
                    return args;
                }

                const wrap = decorateReactComponent<PropsWithName>({}, {onEachElement: [multiActionNodeHook]});
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('0')).to.be.ok; // add attribute
                expect(select('1')).to.be.ok;
                expect(select('0')).to.not.have.attribute('data-delete-me'); // remove attribute
                expect(select('1')).to.not.have.attribute('data-delete-me');
                expect(select('0')).to.have.attribute('data-change-me', 'Jon0'); // change/add attribute
                expect(select('1')).to.have.attribute('data-change-me', 'Jon1');
            });
        });

        describe('root hooks', () => {
            function rootHook(instance: Rendered<PropsWithName>, props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                args.elementProps['data-automation-id'] = 'root';
                args.elementProps['data-change-me'] = instance.props.name;
                args.elementProps['data-delete-me'] = undefined;
                return args;
            }

            it('should allow adding a single root hook to a stateless component that will add/remove/change the root elements props', () => {
                const wrap = decorateReactComponent<PropsWithName>({}, {onRootElement: [rootHook]});
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('root')).to.be.ok;
                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
            });
        });
    });

});
