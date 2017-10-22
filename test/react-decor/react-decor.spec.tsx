import * as React from "react";
import {Component, SFC} from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {makeClassComponent, resetAll, spyAll, testWithBothComponentTypes} from "../test-drivers/test-tools";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {
    devMode,
    ElementArgs,
    Instance,
    reactDecor,
    runInContext,
    StatefulElementHook,
    StatelessElementHook
} from "../../src";
import {asRootOnly} from "../../src/react-decor/index";
import {resetReactCreateElement} from "../../src/react-decor/common";

const _console = console;
describe.assuming(inBrowser(), 'only in browser')('react-decorator', () => {

    beforeEach(resetReactCreateElement);
    const clientRenderer = new ClientRenderer();

    const fakeConsole = spyAll({
        log: () => {
        }
    });

    afterEach("cleanup and reset fakeConsole.log", () => {
        resetAll(fakeConsole);
        runInContext(devMode.OFF, () => clientRenderer.cleanup());
    });


    function hookReturnsUndefined(_props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        return undefined as any;
    }

    function statelessHook1(_props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        fakeConsole.log(args.elementProps['data-automation-id']);
        return args;
    }

    function statelessHook2(_props: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        fakeConsole.log(args.elementProps['data-automation-id']);
        return args;
    }

    function addChangeRemoveHook(componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        args.elementProps['data-add-me'] = componentProps.name;
        args.elementProps['data-change-me'] = componentProps.name;
        args.elementProps['data-delete-me'] = undefined;
        return args;
    }

    type PropsWithName = { name: string };

    const SFComp: React.SFC<PropsWithName> = ({name}) => (
        <div data-automation-id="root" data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span data-automation-id="content" data-delete-me="TBDeleted" data-change-me="TBChanged">
                {name}
            </span>
        </div>
    );

    const classHook: StatefulElementHook<PropsWithName> = function (this: Instance<Component<PropsWithName>>, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        expect(this.props).to.equal(componentProps);
        return args;
    };

    describe(`.onRootElement`, () => {
        let warn = console.warn;
        beforeEach("replace console.warn with spy", () => {
            console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            console.warn = warn;
        });

        const result = <div data-automation-id="Root"/>;
        const RootUnknown: React.SFC<any> = (_: any) => result;
        const RootNull: React.SFC<any> = (_: any) => null;

        it('correctly sets `this` context in class components', () => {
            const wrap = reactDecor.onRootElement(addChangeRemoveHook, classHook);
            const WrappedComp = wrap(makeClassComponent(SFComp));

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('content')).to.be.ok;
        });

        testWithBothComponentTypes(SFComp, function (Comp: any) {
            it('throws when hook returns undefined', () => {
                const wrapWithRootHook = reactDecor.onRootElement(hookReturnsUndefined);

                const WrappedComp = wrapWithRootHook(Comp);

                // expect the error to have a message with these strings: `onChildElement` , `hook`, `undefined`
                expect(() => clientRenderer.render(<WrappedComp/>)).to.throw(Error);
            });

            it('should allow adding a hook to a component that will add/remove/change the root elements props', () => {
                const wrapWithRootHook = reactDecor.onRootElement(addChangeRemoveHook);

                const WrappedComp = wrapWithRootHook(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-add-me', 'Jon');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
            });
        });

        const wrapWithRootHook = reactDecor.onRootElement((_props: object, args: ElementArgs<any>) => args);
        testWithBothComponentTypes(RootUnknown, function (Comp: any) {

            const WrappedComp = wrapWithRootHook(Comp);
            it('warns on unknown root in dev mode', () => {
                runInContext(devMode.ON, () => {
                    clientRenderer.render(<WrappedComp/>);
                    expect(console.warn).to.have.callCount(1);
                    expect(console.warn).to.have.been.calledWithMatch(/unexpected root/);
                });
            });

            it('does not warn on unknown root out of dev mode', () => {
                runInContext(devMode.OFF, () => {
                    clientRenderer.render(<WrappedComp/>);
                    expect(console.warn).to.have.callCount(0);
                });
            });
        });

        testWithBothComponentTypes(RootNull, function (Comp: any) {

            const WrappedComp = wrapWithRootHook(Comp);
            it('does not warn on unknown root if null', () => {
                runInContext(devMode.ON, () => {
                    clientRenderer.render(<WrappedComp/>);
                    expect(console.warn).to.have.callCount(0);
                });
            });
        });
    });

    describe(`.onEachElement`, () => {
        it('correctly sets `this` context in class components', () => {
            const wrap = reactDecor.onEachElement(addChangeRemoveHook, classHook);
            const WrappedComp = wrap(makeClassComponent(SFComp));

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('content')).to.be.ok;
        });
        testWithBothComponentTypes(SFComp, function testOnEachElementDecoration(Comp: any) {
            it('throws when hook returns undefined', () => {
                const wrapWithRootHook = reactDecor.onEachElement(hookReturnsUndefined);

                const WrappedComp = wrapWithRootHook(Comp);

                // expect the error to have a message with these strings: `onChildElement` , `hook`, `undefined`
                expect(() => clientRenderer.render(<WrappedComp/>)).to.throw(Error);
            });
            it('should allow adding a hook to a component that will add/remove/change props of each element', () => {
                const wrapWithRootHook = reactDecor.onEachElement(addChangeRemoveHook);

                const WrappedComp = wrapWithRootHook(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-add-me', 'Jon');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                expect(select('content')).to.be.ok;
                expect(select('content')).to.not.have.attribute('data-delete-me');
                expect(select('content')).to.have.attribute('data-add-me', 'Jon');
                expect(select('content')).to.have.attribute('data-change-me', 'Jon');
            });
        });
    });

    describe(`decorate react component with stateless hooks`, () => {
        function testReactClassAndFunctionDecoration(Comp: any) {
            it('should decorate a react component, without any hooks', () => {
                const wrap = reactDecor.makeFeature<PropsWithName, Component<any>>([]);
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);
                const content = select('content');

                expect(content).to.be.ok;
                expect((content as HTMLSpanElement).innerText).to.equal('Jon');
            });

            describe('onEachElement hooks', () => {
                it('should allow adding a single node hook (which prints every type of node rendered) to a react component', () => {
                    const wrap = reactDecor.makeFeature([statelessHook1]);
                    const WrappedComp = wrap(Comp);

                    clientRenderer.render(<WrappedComp name="Jon"/>);
                    expect(fakeConsole.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                    expect(fakeConsole.log.getCall(1)).to.have.been.calledWithMatch(/root/);
                });

                it('should allow adding multiple nodes hooks to a react component', () => {
                    const wrap = reactDecor.makeFeature([statelessHook1, statelessHook2]);
                    const WrappedComp = wrap(Comp);

                    clientRenderer.render(<WrappedComp name="Jon"/>);

                    expect(fakeConsole.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                    expect(fakeConsole.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                    expect(fakeConsole.log.getCall(2)).to.have.been.calledWithMatch(/root/);
                    expect(fakeConsole.log.getCall(3)).to.have.been.calledWithMatch(/root/);
                });

                it('should allow adding a node hook to a component that will add/remove/change the element props', () => {
                    function multiActionElementHook(componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                        args.elementProps['data-add-me'] = componentProps.name;
                        args.elementProps['data-change-me'] = componentProps.name;
                        args.elementProps['data-delete-me'] = undefined;
                        return args;
                    }

                    const wrap = reactDecor.makeFeature([multiActionElementHook]);
                    const WrappedComp = wrap(Comp);

                    const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                    expect(select('root')).to.have.attribute('data-add-me', 'Jon'); // add attribute
                    expect(select('content')).to.have.attribute('data-add-me', 'Jon');
                    expect(select('root')).to.not.have.attribute('data-delete-me'); // remove attribute
                    expect(select('content')).to.not.have.attribute('data-delete-me');
                    expect(select('root')).to.have.attribute('data-change-me', 'Jon'); // change/add attribute
                    expect(select('content')).to.have.attribute('data-change-me', 'Jon');
                });
            });

            describe('onRootElement hooks', () => {
                it('should allow adding a single root hook to a component that will add/remove/change the root elements props', () => {
                    const wrap = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
                    const WrappedComp = wrap(Comp);

                    const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                    expect(select('root')).to.not.have.attribute('data-delete-me');
                    expect(select('root')).to.have.attribute('data-add-me', 'Jon');
                    expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                    expect(select('content')).to.be.ok;
                });
                it('recognise cloned elements', () => {
                    const wrap = reactDecor.makeFeature(
                        [
                            (_props: any, args: ElementArgs<any>) => ({
                                ...args,
                                elementProps: {...(args.elementProps as object)}
                            }),
                            addChangeRemoveHook
                        ].map(asRootOnly).concat([statelessHook1]));
                    const WrappedComp = wrap(Comp);

                    const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                    expect(select('root')).to.not.have.attribute('data-delete-me');
                    expect(select('root')).to.have.attribute('data-add-me', 'Jon');
                    expect(select('root')).to.have.attribute('data-change-me', 'Jon');
                    expect(select('content')).to.be.ok;
                });
            });
        }

        testWithBothComponentTypes(SFComp, testReactClassAndFunctionDecoration);
    });

    describe('maintain component fields', () => {
        const Comp1: SFC = () => <div/>;
        Comp1.propTypes = {};
        Comp1.contextTypes = {};
        Comp1.defaultProps = {};
        Comp1.displayName = 'foo';

        class ClassComp1 extends React.Component {
            static propTypes = {};
            static contextTypes = {};
            static defaultProps = {};
            static displayName = 'ClassComp1';

            render() {
                return <div/>
            }
        }

        function testReactFields(Comp: any, type: 'SFC' | 'Class Component') {
            it(`should copy react fields - ${type}`, () => {
                const wrap = reactDecor.makeFeature<PropsWithName>([]);
                const WrappedComp = wrap(Comp);

                expect(WrappedComp.propTypes).to.equal(Comp.propTypes);
                expect(WrappedComp.contextTypes).to.equal(Comp.contextTypes);
                expect(WrappedComp.defaultProps).to.equal(Comp.defaultProps);
                expect(WrappedComp.displayName).to.equal(Comp.displayName);
            });
        }

        testReactFields(Comp1, 'SFC');
        testReactFields(ClassComp1, 'Class Component');

        const Comp2: SFC = function foo() {
            return <div/>;
        };

        class Foo extends React.Component {
            render() {
                return <div/>
            }
        }

        function testDefaultDisplayName(Comp: any, type: 'SFC' | 'Class Component') {
            it(`should copy name to displayName if original comp has no displayName - ${type}`, () => {
                runInContext(devMode.ON, () => {
                    const wrap = reactDecor.makeFeature<PropsWithName>([]);
                    const WrappedComp = wrap(Comp);

                    expect(WrappedComp.displayName).to.equal(Comp.name);
                });
            });
        }

        testDefaultDisplayName(Comp2, 'SFC');
        testDefaultDisplayName(Foo, 'Class Component');
    });

    describe('decorate react class component with stateful hooks', () => {
        const ClassComp = makeClassComponent<PropsWithName>(SFComp);

        const statefulHook: StatefulElementHook<PropsWithName> = function (this: Instance<Component<PropsWithName>>, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            expect(this.props).to.equal(componentProps);
            return args;
        };

        it('should allow adding a stateful onRootElement hook to a class component', () => {
            const wrap = reactDecor.makeFeature([], [asRootOnly(statefulHook)]);
            const WrappedComp = wrap(ClassComp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('content')).to.be.ok;
        });

        it('should allow adding a stateful onEachElement hook to a class component', () => {
            const wrap = reactDecor.makeFeature([], [statefulHook]);
            const WrappedComp = wrap(ClassComp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('content')).to.be.ok;
        });
    });

    describe('react decoration warnings', () => {
        let warn = _console.warn;
        beforeEach("replace fakeConsole.warn with spy", () => {
            _console.warn = sinon.spy();
        });

        afterEach("reset fakeConsole.warn", () => {
            _console.warn = warn;
        });

        const result = <div/>;
        const Comp: SFC<PropsWithName> = () => result;
        const CompReturnsNull: SFC<PropsWithName> = () => null;

        function nullTest(Comp: any) {
            it('does not warn on unknown root if null', () => {
                runInContext(devMode.ON, () => {
                    const wrap = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
                    const WrappedComp = wrap(Comp);
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(_console.warn).to.have.callCount(0);
                });
            });
        }

        testWithBothComponentTypes(CompReturnsNull, nullTest);

        function suite(Comp: any) {
            const wrap = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
            const WrappedComp = wrap(Comp);
            it('warns on unknown root in dev mode', () => {
                runInContext(devMode.ON, () => {
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(_console.warn).to.have.callCount(1);
                    expect(_console.warn).to.have.been.calledWithMatch(/unexpected root/);
                });
            });

            it('does not warn on unknown root out of dev mode', () => {
                runInContext(devMode.OFF, () => {
                    clientRenderer.render(<WrappedComp name=""/>);
                    expect(_console.warn).to.have.callCount(0);
                });
            });
        }

        testWithBothComponentTypes(Comp, suite);
    });

    describe(`regression`, () => {
        const SFComp: React.SFC = () => <div><span/></div>;

        function testReactClassAndFunctionDecoration(Comp: any) {
            it('elementProps is never empty', () => {
                const hook: StatelessElementHook<{}> = sinon.spy(function (_p: any, args: ElementArgs<any>): ElementArgs<any> {
                    expect(args.elementProps).to.containSubset({});
                    return args;
                });

                const wrap = reactDecor.makeFeature<PropsWithName, Component<any>>([hook]);
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp/>);
                expect(hook).to.have.been.called;
            });
        }

        testWithBothComponentTypes(SFComp, testReactClassAndFunctionDecoration);

        describe('with multiple children', () => {
            const statelessHook1: StatelessElementHook<{}> = function (_props: {}, args: ElementArgs<any>): ElementArgs<any> {
                return args;
            };
            const statelessHook2: StatelessElementHook<{}> = function (_props: {}, args: ElementArgs<any>): ElementArgs<any> {
                return args;
            };
            const CompToClone = (props: any) => (<div>
                <span data-automation-id="child1"/>
                <span data-automation-id="child2"/>
            </div>);

            function suite(Comp: any) {
                it('multiple children with no changes', () => {
                    const wrapper = reactDecor.makeFeature([statelessHook1, statelessHook2].map(asRootOnly));
                    const WrappedComp = wrapper(Comp);

                    const {select} = clientRenderer.render(<WrappedComp renderChild={true}/>);

                    expect(select("child1")).to.exist;
                    expect(select("child2")).to.exist;
                });

                it('multiple children with adding and removing a child', () => {
                    // this hook adds and removes a child
                    const statelessHook3: StatelessElementHook<{}> = function (_props: {}, args: ElementArgs<any>): ElementArgs<any> {
                        args.children = args.children.concat([]);
                        args.children.pop();
                        args.children.push(<span data-automation-id="child3"/>);

                        return args;
                    };

                    const wrapper = reactDecor.makeFeature([statelessHook1, statelessHook2, statelessHook3].map(asRootOnly));
                    const WrappedComp = wrapper(Comp);

                    const {select} = clientRenderer.render(<WrappedComp renderChild={true}/>);

                    expect(select("child1")).to.exist;
                    expect(select("child2")).to.not.exist;
                    expect(select("child3")).to.exist;
                });
            }

            testWithBothComponentTypes(CompToClone, suite);
        });
    });
});
