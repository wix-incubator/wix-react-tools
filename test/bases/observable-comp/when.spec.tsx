import * as React from 'react';
import { expect, sinon, simulate, ClientRenderer, waitFor } from 'test-drive-react';
import { ObservableComponent, when, resetCounters } from '../../../src/';
import { observable } from 'mobx';
import {testHooks,person,withPerson} from './types';

const testAnchor: string = 'Test-root'

describe('when', () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => {clientRenderer.cleanup();resetCounters()});

    describe('primitive props', () => {

        interface primitiveTestProps extends testHooks, person {}

        class TestComp extends ObservableComponent<primitiveTestProps, object>{

            static defaultProps: primitiveTestProps = {
                onRender: () => { },
                name: 'enter name here',
                age: -1,
                smell: 'bad'
            }

            render() {
                this.props.onRender!(this);
                return <div data-automation-id={testAnchor}>{this.props.name + ' ' + this.props.age}</div>
            }
            componentDidMount() {
            }

            @when(function () { this.props.smell })
            checkStink() {
                this.props.onWhen!(this);
            }

        }

        it('should properly name "when" reactions', () => {
            const { select, waitForDom, container, result } = clientRenderer.render(<TestComp></TestComp>);
            const comp: any = result;


            expect(comp._componentReactions[0].reaction.name).to.equal('TestComp#0 -> when:checkStink')
        });

        it('should be called after an observed prop has been modified', () => {
            const whenSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onWhen={whenSpy}></TestComp>);

            clientRenderer.render(<TestComp onWhen={whenSpy} smell="worse"></TestComp>, container);

            expect(whenSpy).to.have.been.calledOnce;
        });


        it('should work repeatedly', () => {
            const whenSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onWhen={whenSpy}></TestComp>);

            clientRenderer.render(<TestComp onWhen={whenSpy} smell="worse"></TestComp>, container);
            clientRenderer.render(<TestComp onWhen={whenSpy} smell="yuck"></TestComp>, container);

            expect(whenSpy).to.have.been.calledTwice;
        });


        it('should not be called for properties it is not watching', () => {
            const whenSpy = sinon.spy();
            const { select, waitForDom, container } = clientRenderer.render(<TestComp onWhen={whenSpy}></TestComp>);

            clientRenderer.render(<TestComp onWhen={whenSpy} name="worse"></TestComp>, container);
            clientRenderer.render(<TestComp onWhen={whenSpy} name="yuck"></TestComp>, container);

            expect(whenSpy).to.have.not.been.called;
        });

        it('should dispose of reactions when unmounting', () => {
            let comp: TestComp;
            const { select, waitForDom, container } = clientRenderer.render(<div><TestComp onRender={function (component) { comp = component }}></TestComp></div>);

            clientRenderer.render(<div></div>);
            waitForDom(() => {
                expect(comp._componentReactions[0].reaction.isDisposed).to.equal(true);
                expect(comp._renderReaction.isDisposed).to.equal(true)
            });
        })

    });

     describe('complex props', () => {


        interface complexTestProps extends testHooks, withPerson {}

        class TestComp extends ObservableComponent<complexTestProps, object>{

            constructor(props:complexTestProps,context:any){
                super(props,context);
            }
            static defaultProps: complexTestProps = {
                onRender: () => { }
            }

            render() {
                this.props.onRender!(this);
                return <div data-automation-id={testAnchor}>{this.props.man!.name + ' ' + this.props.man!.age}</div>
            }
            componentDidMount() {
            }

            @when<TestComp>(function () { this.props.man!.smell })
            checkStink() {
                this.props.onWhen!(this);
            }

        }


        it('should be called after an observed prop has been modified', () => {
            const whenSpy = sinon.spy();
            const testMan:person = observable({
                smell:'bad'
            })
            const { select, waitForDom, container } = clientRenderer.render(<TestComp man={testMan} onWhen={whenSpy}></TestComp>);

            testMan.smell = 'worse';

            expect(whenSpy).to.have.been.calledOnce;
        });


        it('should be called after an observed prop has been replaced', () => {
             const whenSpy = sinon.spy();
            const testMan:person = observable({
                smell:'bad'
            });
            const testMan2:person = observable({
                smell:'good'
            });
            const { select, waitForDom, container } = clientRenderer.render(<TestComp man={testMan} onWhen={whenSpy}></TestComp>);
            clientRenderer.render(<TestComp man={testMan2} onWhen={whenSpy}></TestComp>,container);

            testMan2.smell = 'worse';

            expect(whenSpy).to.have.been.calledTwice;
        });


        it('should not be called for properties it is not watching', () => {
             const whenSpy = sinon.spy();
            const testMan:person = observable({
                smell:'bad',
                age:90
            })
            const { select, waitForDom, container } = clientRenderer.render(<TestComp man={testMan} onWhen={whenSpy}></TestComp>);

            testMan.age = 91;

            expect(whenSpy).to.not.have.been.called;
        });
    });

});
