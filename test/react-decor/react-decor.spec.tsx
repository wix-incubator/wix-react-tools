import * as React from "react";
import {Component, ComponentType, SFC} from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {resetAll, spyAll, testWithBothComponentTypes} from "../test-drivers/test-tools";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {devMode, ElementArgs, reactDecor, runInContext} from "../../src";
import {asRootOnly, makeRootOnly} from "../../src/react-decor/index";
import {ElementHook, resetReactCreateElement, StatelessElementHook} from "../../src/react-decor/common";

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
            const arg: ElementHook<any, any> = () => 0;
            const result = makeRootOnly(arg);
            expect(result).to.equal(arg);
            expect(result.rootOnly).to.equal(true);
        });

        it('makeRootOnly() returns the hook if it is already readonly', () => {
            const arg: ElementHook<any, any> = () => 0;
            arg.rootOnly = true;
            const result = asRootOnly(arg);
            expect(result).to.equal(arg);
            expect(result.rootOnly).to.equal(true);
        });

        it('asRootOnly() clones (wraps) original method with readonly:true', () => {
            const arg: ElementHook<any, any> = sinon.spy();
            const result: ElementHook<any, any> = asRootOnly(arg);

            expect(result.rootOnly).to.equal(true);
            expect(arg.rootOnly).to.equal(undefined);
            // check that result calls go to the argument
            result(1, 2, true);
            expect(arg).to.have.been.calledWith(1, 2, true);
        });

        it('asRootOnly() result is cached', () => {
            const arg1: ElementHook<any, any> = () => 0;
            const arg2: ElementHook<any, any> = () => 0;
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

            it('throws when hook returns undefined', () => {
                const wrapWithRootHook = reactDecor.makeFeature([hookReturnsUndefined]);
                const WrappedComp = wrapWithRootHook(Comp);
                expect(() => clientRenderer.render(<WrappedComp/>)).to.throw(Error);
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
        describe(`on result of React.cloneElement`, () => {

            // something to clone. similar to SFComp's result, only with no "data-change-me" attributes and no text element {name}
            const resultOrigin = <div data-automation-id="root" data-delete-me="TBDeleted">
                <span data-automation-id="content" data-delete-me="TBDeleted"/>
            </div>;

            const ClonerSFComp: React.SFC<PropsWithName> = ({name}) => {
                const clonedSpan = React.cloneElement(resultOrigin.props.children, {"data-change-me": "TBChanged"}, name);
                return React.cloneElement(resultOrigin, {"data-change-me": "TBChanged"}, clonedSpan);
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
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly([asRootOnly(func1)], [asRootOnly(func2)]);
        });

        it('.onRootElement calls .makeFeature with root-only version of the hook (sfc only)', () => {
            reactDecor.onRootElement(func1);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly([asRootOnly(func1)]);
        });

        it('.onEachElement calls .makeFeature with both hooks (class and sfc)', () => {
            reactDecor.onEachElement(func1, func2);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly([func1], [func2]);
        });

        it('.onEachElement calls .makeFeature with the hook (sfc only)', () => {
            reactDecor.onEachElement(func1);
            expect(reactDecor.makeFeature).to.have.been.calledWithExactly([func1]);
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
