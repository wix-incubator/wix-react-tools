import * as React from "react";
import {Component, ComponentType, SFC} from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {resetAll, spyAll, testWithBothComponentTypes} from "../test-drivers/test-tools";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {devMode, ElementArgs, reactDecor, resetReactMonkeyPatches, runInContext} from "../../src";
import {asRootOnly, makeReactDecoration, makeRootOnly} from "../../src/react-decor/index";
import {ElementHook, Maybe, StatelessElementHook} from "../../src/react-decor/common";

describe.assuming(inBrowser(), 'only in browser')('react-decorator', () => {

    beforeEach(resetReactMonkeyPatches);
    const clientRenderer = new ClientRenderer();

    const fakeConsole = spyAll({
        log: () => {
        }
    });

    afterEach("cleanup and reset fakeConsole.log", () => {
        resetAll(fakeConsole);
        runInContext(devMode.OFF, () => clientRenderer.cleanup());
    });

    function cloneArgsHookNameIsRootId(props: PropsWithName, args: ElementArgs<any>, isRoot: boolean): Maybe<ElementArgs<any>> {
        return isRoot && {...args, newProps: {...args.newProps, "data-automation-id": props.name}};
    }

    function statelessHook1(_props: PropsWithName, args: ElementArgs<any>) {
        fakeConsole.log(args.newProps['data-automation-id']);
    }

    function statelessHook2(_props: PropsWithName, args: ElementArgs<any>) {
        fakeConsole.log(args.newProps['data-automation-id']);
    }

    function addChangeRemoveHook(componentProps: PropsWithName, args: ElementArgs<any>) {
        args.newProps['data-add-me'] = componentProps.name;
        args.newProps['data-change-me'] = componentProps.name;
        args.newProps['data-delete-me'] = undefined;
    }

    type PropsWithName = { name?: string };

    const SFComp: React.SFC<PropsWithName> = ({name}) => (
        <div data-automation-id="root" data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span data-automation-id="content" data-delete-me="TBDeleted" data-change-me="TBChanged">
                {name}
            </span>
        </div>
    );

    describe(`rootOnly helpers`, () => {
        it('makeRootOnly() mutates input to be marked readonly', () => {
            const arg: ElementHook<any> = () => 0;
            const result = makeRootOnly(arg);
            expect(result).to.equal(arg);
            expect(result.rootOnly).to.equal(true);
        });

        it('makeRootOnly() returns the hook if it is already readonly', () => {
            const arg: ElementHook<any> = () => 0;
            arg.rootOnly = true;
            const result = asRootOnly(arg);
            expect(result).to.equal(arg);
            expect(result.rootOnly).to.equal(true);
        });

        it('asRootOnly() clones (wraps) original method with readonly:true', () => {
            const arg: ElementHook<any> = sinon.spy();
            const result: ElementHook<any> = asRootOnly(arg);

            expect(result.rootOnly).to.equal(true);
            expect(arg.rootOnly).to.equal(undefined);
            // check that result calls go to the argument
            result(1, 2 as any, true);
            expect(arg).to.have.been.calledWith(1, 2, true);
        });

        it('asRootOnly() result is cached', () => {
            const arg1: ElementHook<any> = () => 0;
            const arg2: ElementHook<any> = () => 0;
            const result1 = asRootOnly(arg1);
            const result1_2 = asRootOnly(arg1);
            const result2 = asRootOnly(arg2);

            expect(result1).to.not.equal(result2);
            expect(result1).to.equal(result1_2);
        });
    });

    describe(`.makeFeature`, () => {
        function suite(Comp: ComponentType<PropsWithName>) {
            it('decorates a react component, without any hooks', () => {
                const wrap = reactDecor.makeFeature<PropsWithName, Component<any>>([]);
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);
                const content = select('content');

                expect(content).to.be.ok;
                expect((content as HTMLSpanElement).innerText).to.equal('Jon');
            });

            it('uses result of hook as new arguments', () => {
                const wrap = reactDecor.makeFeature([cloneArgsHookNameIsRootId, asRootOnly(statelessHook1)]);
                const WrappedComp = wrap(Comp);

                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(fakeConsole.log).to.have.been.calledWithMatch(/Jon/);
                expect(select('Jon')).to.be.ok;
            });

            it('adding a rootOnly hook to a component will add/remove/change the root elements props', () => {
                const wrapWithRootHook = reactDecor.makeFeature([asRootOnly(addChangeRemoveHook)]);
                const WrappedComp = wrapWithRootHook(Comp);
                const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(select('root')).to.not.have.attribute('data-delete-me');
                expect(select('root')).to.have.attribute('data-add-me', 'Jon');
                expect(select('root')).to.have.attribute('data-change-me', 'Jon');

                expect(select('content')).to.be.ok;
                expect(select('content')).to.have.attribute('data-delete-me');
                expect(select('content')).to.not.have.attribute('data-add-me', 'Jon');
                expect(select('content')).to.have.attribute('data-change-me', 'TBChanged');
            });

            it('adding a hook to a component will add/remove/change props of each element', () => {
                const wrapWithRootHook = reactDecor.makeFeature([addChangeRemoveHook]);
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

            it('allow adding multiple nodes hooks to a react component', () => {
                const wrap = reactDecor.makeFeature([statelessHook1, statelessHook2]);
                const WrappedComp = wrap(Comp);

                clientRenderer.render(<WrappedComp name="Jon"/>);

                expect(fakeConsole.log.getCall(0)).to.have.been.calledWithMatch(/content/);
                expect(fakeConsole.log.getCall(1)).to.have.been.calledWithMatch(/content/);
                expect(fakeConsole.log.getCall(2)).to.have.been.calledWithMatch(/root/);
                expect(fakeConsole.log.getCall(3)).to.have.been.calledWithMatch(/root/);
            });
        }

        testWithBothComponentTypes(SFComp, suite);
        describe(`on result of React.cloneElement (once or more on same element)`, () => {

            // something to clone. similar to elements in SFComp's result
            const templateElement = <div data-automation-id="root" data-delete-me="TBDeleted"
                                         data-change-me="TBChanged"/>;

            const ClonerSFComp: React.SFC<PropsWithName> = ({name}) => {
                const content = React.cloneElement(templateElement, {"data-automation-id": "content"}, name);
                // notice how root is a result of two clones
                return React.cloneElement(content, {"data-automation-id": "root"}, content);
            };

            testWithBothComponentTypes(ClonerSFComp, suite);
        });
    });

    describe(`.makeFeature sugar wrappings`, () => {

        const func1 = (() => {
        }) as any;
        const func2 = (() => {
        }) as any;

        before(() => {
            sinon.spy(reactDecor, 'makeFeature');
        });
        afterEach(() => {
            (reactDecor as any).makeFeature.reset();
        });
        after(() => {
            (reactDecor as any).makeFeature.restore();
        });


        it('.onRootElement calls .makeFeature with root-only version of both hooks (class and sfc)', () => {
            reactDecor.onRootElement(func1, func2);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly(makeReactDecoration([asRootOnly(func1)], [asRootOnly(func2)]));
        });

        it('.onRootElement calls .makeFeature with root-only version of the hook (sfc only)', () => {
            reactDecor.onRootElement(func1);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly(makeReactDecoration([asRootOnly(func1)]));
        });

        it('.onEachElement calls .makeFeature with both hooks (class and sfc)', () => {
            reactDecor.onEachElement(func1, func2);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly(makeReactDecoration([func1], [func2]));
        });

        it('.onEachElement calls .makeFeature with the hook (sfc only)', () => {
            reactDecor.onEachElement(func1);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly(makeReactDecoration([func1]));
        });
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

        function testReactFields(Comp: ComponentType, type: 'SFC' | 'Class Component') {
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

        function testDefaultDisplayName(Comp: ComponentType, type: 'SFC' | 'Class Component') {
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

    describe(`regression`, () => {
        const SFComp: React.SFC = () => <div><span/></div>;

        function testReactClassAndFunctionDecoration(Comp: ComponentType) {
            it('newProps is never falsy', () => {
                const hook: StatelessElementHook<{}> = sinon.spy(function (_p: any, args: ElementArgs<any>) {
                    expect(args.newProps).to.be.ok;
                    expect(args.newProps).to.containSubset({});
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

            function suite(Comp: ComponentType<any>) {
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
