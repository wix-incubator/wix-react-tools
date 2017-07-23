import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {expect, sinon, ClientRenderer} from 'test-drive-react';
import {orchastrated,registerForConstructor,lifeCycleHook,registerLifeCycle, lifeCycleHooks, lifeCycleHookName} from "../../src/old/mixin-orchestrator";
import {ReactConstructor} from "../../src/old/utils/types";
import {inBrowser} from "mocha-plugin-env/dist/src";
import _reduce = require('lodash/reduce');
import _forEach = require('lodash/forEach');

//'mixin1SpyBefore','mixin2SpyBefore','mixin1SpyAfter','mixin2SpyAfter','mixin1SpyAround','mixin2SpyAround','userCodeSpy'
class Spies {
    mixin1SpyBefore = sinon.spy();
    mixin2SpyBefore = sinon.spy();
    mixin1SpyAfter = sinon.spy();
    mixin2SpyAfter = sinon.spy();
    mixin1SpyAround = sinon.spy();
    mixin2SpyAround = sinon.spy();
    userCodeSpy = sinon.spy();
}
function expectCallOrder(order:{name:string,spy:sinon.SinonSpy}[],calls:number=1){

    for(var i=0;i<order.length;i++){
        expect(order[i].spy,order[i].name).to.have.callCount(calls);
        if(i>0){
            expect(order[i].spy,order[i].name+' after '+order[i-1].name).to.have.been.calledAfter(order[i-1].spy)
        }
    }
}

function expectNoCalls(spies:Spies){
    _forEach(spies,(element:sinon.SinonSpy) => {
        expect(element,name).to.have.callCount(0);
    });
}

function getSpiesOrder(spies: Spies) {
    return [{name: 'mixin1SpyBefore', spy: spies.mixin1SpyBefore},
        {name: 'mixin2SpyBefore', spy: spies.mixin2SpyBefore},
        {name: 'userCodeSpy', spy: spies.userCodeSpy},
        {name: 'mixin2SpyAfter', spy: spies.mixin2SpyAfter},
        {name: 'mixin1SpyAfter', spy: spies.mixin1SpyAfter}];
}

describe("mixin orchestrator", () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    describe('register: constructor',()=>{
         it('allows mutliple mixins to run code in constructor', () => {


            const mixin1Spy = sinon.spy();
            const mixin2Spy = sinon.spy();
            function mixin1<T>(cls:T):T{
                registerForConstructor(cls,mixin1Spy);
                return cls;
            }

            function mixin2<T>(cls:T):T{
                registerForConstructor(cls,mixin2Spy);
                return cls;
            }

            @mixin2
            @mixin1
            @orchastrated
            class MixinBaseComp<P,S> extends React.Component<P, S> {
                render() {
                    return <div data-automation-id="test"></div>;
                }
            }

            class UserClass extends MixinBaseComp<any,any>{
                constructor(props:any,constext:any){
                    expect(mixin1Spy).to.have.callCount(0);
                    expect(mixin2Spy).to.have.callCount(0);
                    super();
                    expect(mixin1Spy).to.have.calledWith(this);
                    expect(mixin2Spy).to.have.calledWith(this);
                    expectCallOrder([{name:'mixin1Spy',spy:mixin1Spy},{name:'mixin2Spy',spy:mixin2Spy}]);
                }
            }

            renderToString(<UserClass></UserClass>);

            expect(mixin1Spy).to.have.callCount(1);
            expect(mixin2Spy).to.have.callCount(1);
        });

    })
    describe('life cycle hooks',()=>{
        const reactLifeCycleCreation:lifeCycleHookName[] = ['render','componentDidMount'];
        const reactLifeCycle:lifeCycleHookName[] = ['render','componentDidMount','componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate','componentWillUnmount'];

        reactLifeCycle.map((lifeCycleMethod)=>{
            const isCreationLifeCycle:boolean = reactLifeCycleCreation.indexOf(lifeCycleMethod)!=-1
            describe.assuming(inBrowser(),'inbrowser')('client side life cycle',()=>{
                describe('before and after: '+lifeCycleMethod,()=>{
                    it('allows mutliple mixins to run code in '+lifeCycleMethod+' with user method', () => {
                        const spies:Spies = new Spies();

                        const spyOrder = getSpiesOrder(spies);

                        //TODO generalize
                        function mixin1<T>(cls:T):T{
                            registerLifeCycle(cls,'before',lifeCycleMethod,spies.mixin1SpyBefore);
                            registerLifeCycle(cls,'after',lifeCycleMethod,spies.mixin1SpyAfter);
                            // registerLifeCycle(cls,'around',lifeCycleMethod,mixin1Spy);
                            return cls;
                        }
                        function mixin2<T>(cls:T):T{
                            registerLifeCycle(cls,'before',lifeCycleMethod,spies.mixin2SpyBefore);
                            registerLifeCycle(cls,'after',lifeCycleMethod,spies.mixin2SpyAfter);
                            return cls;
                        }

                        // TODO test using directly on user class
                        // TODO test what happens when user overrides hooked method with calling super
                        // TODO test what happens with no user nethod

                        // define base class
                        @mixin2
                        @mixin1
                        @orchastrated
                        class MixinBaseComp<P,S> extends React.Component<P, S> {

                        }

                        // define final component class
                        class UserClass extends MixinBaseComp<any,any>{
                            render(){
                                return <div></div>
                            }
                        }
                        // simulate user overriding lifeCycleMethod with no call to super[lifeCycleMethod]
                        (UserClass as any).prototype[lifeCycleMethod] = function(this:UserClass):any{
                            spies.userCodeSpy();
                            if(lifeCycleMethod==='render'){
                                return <div></div>
                            }
                        };

                        const {container} = clientRenderer.render(<div><UserClass></UserClass></div>);
                        if(isCreationLifeCycle){
                            expectCallOrder([...spyOrder]);
                        }else{
                            expectNoCalls(spies);
                        }

                        clientRenderer.render(<div><UserClass></UserClass></div>,container);

                        switch(lifeCycleMethod){
                            case 'render':
                                //render should have been called twice
                                expectCallOrder([...spyOrder,...spyOrder],2);
                                break;
                            case 'componentDidMount':
                                //componentDidMount should have been called once (at first clientRenderer.render)
                                expectCallOrder([...spyOrder]);
                                break;
                            case 'componentWillUnmount':
                                expectNoCalls(spies);
                                break;
                            default:
                                //'componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate' should have happened (at 2nd clientRenderer.render)
                                expectCallOrder([...spyOrder]);
                                break;

                        }

                        clientRenderer.render(<div></div>,container);

                        switch(lifeCycleMethod){
                            case 'render':
                                //render should have been called twice
                                expectCallOrder([...spyOrder,...spyOrder],2);
                                break;
                            case 'componentDidMount':
                                //componentDidMount should have been called once (at first clientRenderer.render)
                                expectCallOrder([...spyOrder]);
                                break;
                            case 'componentWillUnmount':
                                expectCallOrder([...spyOrder]);
                                break;
                            default:
                                //'componentWillReceiveProps','shouldComponentUpdate','componentWillUpdate','componentDidUpdate' should have happened (at 2nd clientRenderer.render)
                                expectCallOrder([...spyOrder]);
                                break;

                        }
                    });
                })
            });
        });

    })


    it('allows mixins to activate orchestrator automatically', () => {


        const mixin1Spy = sinon.spy();
        const mixin2Spy = sinon.spy();


        function mixin1<C extends ReactConstructor<any>>(cls:C):C{
            const oCls = orchastrated(cls);
            registerForConstructor(cls,mixin1Spy);
            return oCls;
        }

        function mixin2<C extends ReactConstructor<any>>(cls:C):C{
            const oCls = orchastrated(cls);
            registerForConstructor(cls,mixin2Spy);
            return oCls;
        }

        @mixin2
        @mixin1
        class MixinBaseComp<P,S> extends React.Component<P, S> {
            render() {
                return <div data-automation-id="test"></div>;
            }
        }

        class UserClass extends MixinBaseComp<any,any>{
            constructor(props:any,context:any){
                expect(mixin1Spy).to.have.callCount(0);
                expect(mixin2Spy).to.have.callCount(0);
                super();
                expect(mixin1Spy).to.have.callCount(1);
                expect(mixin1Spy).to.have.calledWith(this);
                expect(mixin2Spy).to.have.callCount(1);
                expect(mixin2Spy).to.have.calledWith(this);
                expect(mixin1Spy).to.have.been.calledBefore(mixin2Spy);
            }
        }


        renderToString(<UserClass></UserClass>);
    });
});
