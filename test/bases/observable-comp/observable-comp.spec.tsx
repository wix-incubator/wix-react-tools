import * as React from 'react';
import { expect, sinon, simulate, ClientRenderer } from 'test-drive-react';
import { ObservableComponent,resetCounters } from '../../../src/';
import { observable } from 'mobx';
import {testHooks,person,withPerson} from './types';

const testAnchor: string = 'Test-root';


describe('ObservableComponent', () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => {clientRenderer.cleanup();resetCounters()});

    describe('primitive state', () => {


        class TestComp extends ObservableComponent<testHooks, person>{
            static defaultState: person = {
                name: 'enter name here',
                age: -1,
                smell: 'bad'
            };
            static defaultProps: testHooks = {
                onRender: (comp: any) => { },
                onMount: (comp: any) => { }
            };

            render() {
                this.props.onRender && this.props.onRender(this);
                return <div data-automation-id={testAnchor}>{this.state.name + ' ' + this.state.age}</div>
            }
            componentDidMount() {
                this.props.onMount && this.props.onMount(this);
            }
        }


        it('should render default state', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom } = clientRenderer.render(<TestComp onRender={renderSpy}/>);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('enter name here -1');
        });


        it('should re-render after modifying its state (for rendered parts of its state)', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom } = clientRenderer.render(<TestComp onMount={(comp: any) => {
                comp.state.name = 'moshe';
                comp.state.age = 80;
            }} onRender={renderSpy}/>);

            expect(renderSpy).to.have.been.calledTwice;
            expect(select(testAnchor)).to.have.text('moshe 80');
        });


        it('should not rerender after modifying its state (for un-rendered parts of its state)', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom } = clientRenderer.render(<TestComp onMount={(comp: any) => {
                comp.state.smell = 'good';
            }} onRender={renderSpy}/>);

            expect(renderSpy).to.have.been.calledOnce;
        });


    });


    describe('primitive props', () => {


        type primitiveTestProps =  person & testHooks;

        class TestComp extends ObservableComponent<primitiveTestProps, object>{

            static defaultProps: primitiveTestProps = {
                onRender: () => { },
                onMount: () => { },
                name: 'enter name here',
                age: -1,
                smell: 'bad'
            };

            render() {
                this.props.onRender && this.props.onRender(undefined);
                return <div data-automation-id={testAnchor}>{this.props.name + ' ' + this.props.age}</div>
            }
            componentDidMount() {
                this.props.onMount && this.props.onMount(undefined);
            }
        }


        it('should render default props', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom } = clientRenderer.render(<TestComp onRender={renderSpy}/>);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('enter name here -1');
        });

        it('should render initial provided props', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom } = clientRenderer.render(<TestComp onRender={renderSpy} name="moshe"/>);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('moshe -1');
        });

        it('should re-render after its props are modified (for rendered properties, 3 renders)', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onRender={renderSpy}/>);

            clientRenderer.render(<TestComp onRender={renderSpy} name="moshe" age={80}/>, container);

            expect(renderSpy).to.have.been.calledTwice;
            expect(select(testAnchor)).to.have.text('moshe 80');

            clientRenderer.render(<TestComp onRender={renderSpy} name="moshe" age={81}/>, container);

            expect(renderSpy).to.have.been.calledThrice;
            expect(select(testAnchor)).to.have.text('moshe 81');
        });

        it('should not rerender after modifying its props (when changing unrendered field)', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<div><TestComp onRender={renderSpy}/></div>);


            clientRenderer.render(<div><TestComp onRender={renderSpy} smell="good"/></div>, container);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('enter name here -1');
        });


    });

    describe('complex props', () => {



        interface complexTestProps extends testHooks, withPerson {
        }

        class TestComp extends ObservableComponent<complexTestProps, object>{

            static defaultProps: complexTestProps = {
                onRender: () => { },
                onMount: () => { },
                man: {
                    name: 'yossi',
                    age: 50,
                    smell: 'funcky'
                }
            };

            render() {
                this.props.onRender && this.props.onRender(this);
                return <div data-automation-id={testAnchor}>{this.props.man!.name + ' ' + this.props.man!.age}</div>
            }
            componentDidMount() {
                this.props.onMount && this.props.onMount(this);
            }
        }

        it('should re-render after its props are shalowly modified (for rendered props)', () => {
            const renderSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onRender={renderSpy}/>);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('yossi 50');

            clientRenderer.render(<TestComp onRender={renderSpy} man={{ name: "moshe", age: 80 }}/>, container);

            expect(renderSpy).to.have.been.calledTwice;
            expect(select(testAnchor)).to.have.text('moshe 80');
        });

        it('should re-render after its props are deeply modified (for rendered props)', () => {
            const renderSpy = sinon.spy();
            const testPerson: person = observable({ name: "moshe", age: 80 })
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onRender={renderSpy} man={testPerson}/>);

            expect(renderSpy).to.have.been.calledOnce;
            expect(select(testAnchor)).to.have.text('moshe 80');

            testPerson.name = 'shlomo';

            expect(renderSpy).to.have.been.calledTwice;
            expect(select(testAnchor)).to.have.text('shlomo 80');
        });

        it('should re-render after its props are replaced and then modified (when rendering its prop, observable input)', () => {
            const renderSpy = sinon.spy();
            const testPerson: person = observable({ name: "moshe", age: 80 })
            const testPerson2: person = observable({ name: "shlomo", age: 30 })
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onRender={renderSpy} man={testPerson}/>);

            clientRenderer.render(<TestComp onRender={renderSpy} man={testPerson2}/>, container);

            testPerson2.name = "monkey";

            expect(renderSpy).to.have.been.calledThrice;
            expect(select(testAnchor)).to.have.text('monkey 30');
        });


        it('should not re-render after its props are modified (when not rendering its prop, observable input)', () => {
            const renderSpy = sinon.spy();
            const testPerson: person = observable({ name: "moshe", age: 80 })
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onRender={renderSpy} man={testPerson}/>);

            testPerson.smell = 'flunky';

            expect(renderSpy).to.have.been.calledOnce;
        });


    });
    interface props extends testHooks, person {}


    class MyWatchesEverythingComp extends ObservableComponent<props, object>{

        static defaultProps: props = {
            name: 'yossi'
        };

        static watchesAllProps:boolean = true;
        render() {
            this.props.onRender && this.props.onRender(this);
            return <div data-automation-id={testAnchor}>{this.props.name + ' ' + (this.props as any).age}</div>
        }
    }
    describe('watch all fields', function () {
        it('should watch all fields provided at constructor', () => {
            const renderSpy = sinon.spy();

            const { select, waitForDom, container } = clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="gaga" age={5}/>);

            clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="gaga" age={6}/>,container);
            expect(renderSpy).to.have.been.calledTwice;
        });
        it('should watch all fields provided at receive props', () => {
            const renderSpy = sinon.spy();

            const { select, waitForDom, container } = clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="gaga"/>);

            clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="gaga" age={6}/>,container);
            expect(renderSpy).to.have.been.calledTwice;
        });
        it('should watch all fields provided at receive props (when also changing watched prop)', () => {
            const renderSpy = sinon.spy();

            const { select, waitForDom, container } = clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="gaga"/>);

            clientRenderer.render(<MyWatchesEverythingComp onRender={renderSpy} name="baga" age={6}/>,container);
            expect(renderSpy).to.have.been.calledTwice;
        });
    });

    interface props extends testHooks,person {}


    class MyCompName extends ObservableComponent<props, person>{

        static defaultProps: props = {
            name: 'yossi'
        };
        static defaultState: person = {
            age: 5
        };
        render() {
            this.props.onRender && this.props.onRender(this);
            return <div data-automation-id={testAnchor}>{this.props.name + ' ' + this.state.age}</div>
        }
    }

    describe('names', function () {
        it('should properly name generated constructs', () => {
            const { select, waitForDom, container, result } = clientRenderer.render(<MyCompName />);
            const comp: any = result;

            expect(comp._renderReaction.name).to.equal('MyCompName#0 -> render');
            expect(comp.props.$mobx.name).to.equal('MyCompName#0.props');
            expect(comp.state.$mobx.name).to.equal('MyCompName#0.state');
        });
    });
    describe('dispose', function () {
        it('should dispose render reaction', () => {
            let comp: any;
            const { select, waitForDom, container, result } = clientRenderer.render(<MyCompName onRender={(c) => comp = c}/>);

            clientRenderer.render(<div></div>);
            waitForDom(() => expect(comp._renderReaction.isDisposed).to.equal(true));
        });
    });
});
