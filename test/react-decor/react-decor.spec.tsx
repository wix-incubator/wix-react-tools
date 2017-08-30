import * as React from 'react';
import { expect, ClientRenderer } from 'test-drive-react';
import { spyAll, resetAll } from '../test-drivers/test-tools';
import { inBrowser } from "mocha-plugin-env/dist/src";
import { ElementArgs, Rendered, StatefulElementHook, StatelessElementHook } from '../../src/react-decor/common';
import { decorateReactComponent } from '../../src/react-decor'; // todo: implement

describe.assuming(inBrowser(), 'only in browser')('react-decorator', () => {
    const clientRenderer = new ClientRenderer();

    const console = spyAll({
        log: () => { }
    });

    afterEach("cleanup and reset console.log", () => {
        resetAll(console);
        clientRenderer.cleanup();
    });

    const statelessHook1: StatelessElementHook<PropsWithName> = function (instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        console.log(args.elementProps['data-automation-id']);
        return args;
    };

    const statelessHook2: StatelessElementHook<PropsWithName> = function (instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        console.log(args.elementProps['data-automation-id']);
        return args;
    };

    type PropsWithName = { name: string };

    const SFComp: React.SFC<PropsWithName> = ({ name }) => (
        <div data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span data-automation-id="content">
                {name}
            </span>
        </div>
    );

    class ClassComp extends React.Component<PropsWithName> {
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

    function testReactClassAndFunctionDecoration(Comp: any, testLabel: 'SFC'|'Class') {
        describe(`decorate react component with stateless hooks - ${testLabel}`, () => {
            it('should wrap a react component, without any hooks', () => {
                const wrap = decorateReactComponent<PropsWithName, Rendered<any>>({});
                const WrappedComp = wrap(Comp);

                const { select } = clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only
                const content = select('content');

                expect(content).to.be.ok;
                expect((content as HTMLSpanElement).innerText).to.equal('Jon');
            });

            describe('node hooks', () => {
                it('should allow adding a single node hook (which prints every type of node rendered) to a react component', () => {
                    const wrap = decorateReactComponent({ onEachElement: [statelessHook1] });
                    const WrappedComp = wrap(Comp);

                    clientRenderer.render(<WrappedComp name="Jon" />);

                    expect(console.log).to.have.callCount(2);
                    expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
                    expect(console.log).to.have.been.calledWithMatch(/content/);
                });

                it('should allow adding multiple nodes hooks to a react component', () => {
                    const wrap = decorateReactComponent({ onEachElement: [statelessHook1, statelessHook2] });
                    const WrappedComp = wrap(Comp);

                    clientRenderer.render(<WrappedComp name="Jon" />);

                    expect(console.log).to.have.callCount(4);
                    expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                    expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                    expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
                    expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
                });

                it('should allow adding a node hook to a component that will add/remove/change the element props', () => {
                    let index = 0;
                    function multiActionElementHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                        args.elementProps['data-automation-id'] = index;
                        args.elementProps['data-change-me'] = componentProps.name + index;
                        args.elementProps['data-delete-me'] = undefined;
                        index++;
                        return args;
                    }

                    const wrap = decorateReactComponent({ onEachElement: [multiActionElementHook] });
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
                function rootHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                    args.elementProps['data-automation-id'] = 'root';
                    args.elementProps['data-change-me'] = componentProps.name;
                    args.elementProps['data-delete-me'] = undefined;
                    return args;
                }

                it('should allow adding a single root hook to a component that will add/remove/change the root elements props', () => {
                    const wrap = decorateReactComponent({ onRootElement: [rootHook] });
                    const WrappedComp = wrap(Comp);

                    const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

                    expect(select('root')).to.be.ok;
                    expect(select('root')).to.not.have.attribute('data-delete-me');
                    expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                    expect(select('content')).to.be.ok;
                });
            });
        });
    }

    testReactClassAndFunctionDecoration(SFComp, 'SFC');
    testReactClassAndFunctionDecoration(ClassComp, 'Class');

    describe('decorate react class component with stateful hooks', () => {
        const statefulHook: StatefulElementHook<PropsWithName> = function (instance: Rendered<PropsWithName>, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            expect(instance.props).to.equal(componentProps);
            return args;
        };

        it('should allow adding a stateful hook to a class component', () => {
            const wrap = decorateReactComponent({}, { onRootElement: [statefulHook] });
            const WrappedComp = wrap(ClassComp);

            const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

            expect(select('content')).to.be.ok;
        });
    });

    it('elementProps is never empty (regression)', () => {
        const Comp: React.SFC = () => <div><span /></div>;
        const hook: StatelessElementHook<{}> = function (_i: null, _p: any, args: ElementArgs<any>): ElementArgs<any> {
            expect(args.elementProps).to.containSubset({});
            return args;
        };

        const wrap = decorateReactComponent<PropsWithName, Rendered<any>>({
            onRootElement: [hook],
            onEachElement: [hook]
        });
        const WrappedComp = wrap(Comp);

        clientRenderer.render(<WrappedComp/>);
    });
});
