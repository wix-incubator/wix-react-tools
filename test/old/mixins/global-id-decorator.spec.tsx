import * as React from 'react';
import { expect, ClientRenderer } from 'test-drive-react';
import { GlobalID, reset, applyMixin } from '../../../src';
import {inBrowser} from "mocha-plugin-env/dist/src";


class MainProps {
    id?: string;
    testId: string;
}

describe.assuming(inBrowser(), 'only in browser')('Global ID Decorator', () => {

    const clientRenderer = new ClientRenderer();
    beforeEach(() => reset());
    afterEach(() => clientRenderer.cleanup());

    @GlobalID()
    class BaseComp<P, S> extends React.Component<P & { id?: string }, S>  {

        getGlobalID(str: string) {
            return 'This is overridden by the decorator';
        };

    }

    describe('If not used on ROOT node', () => {

        class MainClass extends BaseComp<{}, {}> {
            props: MainProps;
            render() {
                return <div data-automation-id={'MAIN_CLASS_ROOT' + this.props.testId}>
                    <TestClass id={this.getGlobalID('MyTestComp')}></TestClass>
                    <label data-automation-id='MAIN_CLASS_LABEL' htmlFor={this.getGlobalID('MyTestComp')} ></label>
                </div>
            }
        }

        class TestClass extends BaseComp<{}, {}> {
            render() {
                return <div data-automation-id='TEST_CLASS_ROOT'>
                    <input data-automation-id='TEST_CLASS_INPUT1' type="text" id={this.getGlobalID('MyInput')} />
                    <label data-automation-id='TEST_CLASS_LABEL1' htmlFor={this.getGlobalID('MyInput')}></label>
                    <input data-automation-id='TEST_CLASS_INPUT2' type="text" id={this.getGlobalID('MyOtherInput')} />
                    <label data-automation-id='TEST_CLASS_LABEL2' htmlFor={this.getGlobalID('MyOtherInput')}></label>
                </div>
            }
        }


        it('Uses external ID if passed', () => {
            const { select } = clientRenderer.render(<MainClass testId='1' id={'EXT'}></MainClass>);

            expect(select('MAIN_CLASS_ROOT1')).to.exist;
            expect(select('MAIN_CLASS_ROOT1', 'TEST_CLASS_ROOT')).to.not.have.attribute('id');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'EXT_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'EXT_MyTestComp_MyInput');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'EXT_MyTestComp_MyInput');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'EXT_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'EXT_MyTestComp_MyOtherInput');
        });

        it('Generates an ID if external ID is not passed', () => {
            const { select } = clientRenderer.render(<MainClass testId='_I'></MainClass>);

            expect(select('MAIN_CLASS_ROOT_I')).to.exist;
            expect(select('MAIN_CLASS_ROOT_I', 'TEST_CLASS_ROOT')).to.not.have.attribute('id');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'MainClass1_MyTestComp_MyInput');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'MainClass1_MyTestComp_MyInput');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'MainClass1_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'MainClass1_MyTestComp_MyOtherInput');
        });

        it('Generates counter-based IDs for multiple instances of same class', () => {
            const { select } = clientRenderer.render(
                <div>
                    <MainClass testId='1'></MainClass>
                    <MainClass testId='2'></MainClass>
                </div>
            );

            expect(select('MAIN_CLASS_ROOT1')).to.exist;
            expect(select('MAIN_CLASS_ROOT2')).to.exist;
            expect(select('MAIN_CLASS_ROOT1', 'MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
            expect(select('MAIN_CLASS_ROOT2', 'MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass2_MyTestComp');
        });
    });

    describe('If used on ROOT node', () => {

        class MainClass extends BaseComp<{}, {}> {
            props: MainProps;
            render() {
                return <div data-automation-id={'MAIN_CLASS_ROOT' + this.props.testId}>
                    <TestClass id={this.getGlobalID('MyTestComp')}></TestClass>
                    <label data-automation-id='MAIN_CLASS_LABEL' htmlFor={this.getGlobalID('MyTestComp')}></label>
                </div>
            }
        }

        class TestClass extends BaseComp<{}, {}> {
            render() {
                return <div data-automation-id='TEST_CLASS_ROOT' id={this.getGlobalID('ROOT')} >
                    <input data-automation-id='TEST_CLASS_INPUT1' type="text" id={this.getGlobalID('ROOT')} />
                    <label data-automation-id='TEST_CLASS_LABEL1' htmlFor={this.getGlobalID('ROOT')}></label>
                    <input data-automation-id='TEST_CLASS_INPUT2' type="text" id={this.getGlobalID('MyOtherInput')} />
                    <label data-automation-id='TEST_CLASS_LABEL2' htmlFor={this.getGlobalID('MyOtherInput')}></label>
                </div>
            }
        }

        it('Uses external ID for root node if passed', () => {
            const { select } = clientRenderer.render(<MainClass testId='1' id={'EXT'} ></MainClass>);

            expect(select('MAIN_CLASS_ROOT1')).to.exist;
            expect(select('MAIN_CLASS_ROOT1', 'TEST_CLASS_ROOT')).to.have.attribute('id', 'EXT_MyTestComp');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'EXT_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'EXT_MyTestComp');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'EXT_MyTestComp');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'EXT_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'EXT_MyTestComp_MyOtherInput');
        });

        it('Generates explicit ID for root node if external ID is not passed', () => {
            const { select,  } = clientRenderer.render(<MainClass testId='1' ></MainClass>);

            expect(select('MAIN_CLASS_ROOT1')).to.exist;
            expect(select('MAIN_CLASS_ROOT1', 'TEST_CLASS_ROOT')).to.have.attribute('id', 'MainClass1_MyTestComp');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'MainClass1_MyTestComp');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'MainClass1_MyTestComp');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'MainClass1_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'MainClass1_MyTestComp_MyOtherInput');
        });
    });

    describe('CreateElement syntax sugar', () => {

        @GlobalID()
        class OtherBaseComp<P, S> extends React.Component<P & { id?: string }, S>  {

            constructor(props: P) {
                super(props);
                applyMixin(this);
            }

            getGlobalID(str: string) {
                return 'This is overridden by the decorator';
            };
        }

        class MainClass extends OtherBaseComp<{}, {}> {
            props: MainProps;
            render() {
                return <div data-automation-id={'MAIN_CLASS_ROOT' + this.props.testId}>
                    <TestClass id='MyTestComp'></TestClass>
                    <label data-automation-id='MAIN_CLASS_LABEL' htmlFor='MyTestComp'></label>
                </div>
            }
        }

        class TestClass extends OtherBaseComp<{}, {}> {
            render() {
                return <div data-automation-id='TEST_CLASS_ROOT'>
                    <input data-automation-id='TEST_CLASS_INPUT1' type="text" id='MyInput' />
                    <label data-automation-id='TEST_CLASS_LABEL1' htmlFor='MyInput'></label>
                    <input data-automation-id='TEST_CLASS_INPUT2' type="text" id={this.getGlobalID('MyOtherInput')} />
                    <label data-automation-id='TEST_CLASS_LABEL2' htmlFor={this.getGlobalID('MyOtherInput')}></label>
                </div>
            }
        }

        it('Generates an ID if external ID is not passed', () => {
            const { select } = clientRenderer.render(<MainClass testId='_I' ></MainClass>);

            expect(select('MAIN_CLASS_ROOT_I')).to.exist;
            expect(select('MAIN_CLASS_ROOT_I', 'TEST_CLASS_ROOT')).to.not.have.attribute('id');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'MainClass1_MyTestComp_MyInput');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'MainClass1_MyTestComp_MyInput');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'MainClass1_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'MainClass1_MyTestComp_MyOtherInput');
        });

        it('Uses external ID if passed', () => {
            const { select } = clientRenderer.render(<MainClass testId='_I' id={'EXT'}></MainClass>);

            expect(select('MAIN_CLASS_ROOT_I')).to.exist;
            expect(select('MAIN_CLASS_ROOT_I', 'TEST_CLASS_ROOT')).to.not.have.attribute('id');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'EXT_MyTestComp');
            expect(select('TEST_CLASS_INPUT1')).to.have.attribute('id', 'EXT_MyTestComp_MyInput');
            expect(select('TEST_CLASS_LABEL1')).to.have.attribute('for', 'EXT_MyTestComp_MyInput');
            expect(select('TEST_CLASS_INPUT2')).to.have.attribute('id', 'EXT_MyTestComp_MyOtherInput');
            expect(select('TEST_CLASS_LABEL2')).to.have.attribute('for', 'EXT_MyTestComp_MyOtherInput');
        });

    });

    describe('Odds and Ends', () => {

        it('Handles both id and htmlFor if present on same element', () => {

            class MainClass extends BaseComp<{}, {}> {
                render() {
                    return <div data-automation-id={'MAIN_CLASS_ROOT'}>
                        <input type="text" data-automation-id='MAIN_CLASS_DIV' id={this.getGlobalID('MyTestComp')} />
                        <label data-automation-id='MAIN_CLASS_LABEL' id={this.getGlobalID('MyTestComp')} htmlFor={this.getGlobalID('MyTestComp')} ></label>
                    </div>
                }
            }

            const { select } = clientRenderer.render(<MainClass></MainClass>);

            expect(select('MAIN_CLASS_DIV')).to.have.attribute('id', 'MainClass1_MyTestComp');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('id', 'MainClass1_MyTestComp');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
        });


        it('Is not confused by annotations on inheriting classes', () => {

            @GlobalID()
            class MainClass extends BaseComp<{}, {}> {
                render() {
                    return <div data-automation-id={'MAIN_CLASS_ROOT'}>
                        <input type="text" data-automation-id='MAIN_CLASS_DIV' id={this.getGlobalID('MyTestComp')} />
                        <label data-automation-id='MAIN_CLASS_LABEL' htmlFor={this.getGlobalID('MyTestComp')} ></label>
                    </div>
                }
            }

            const { select } = clientRenderer.render(<MainClass></MainClass>);

            expect(select('MAIN_CLASS_DIV')).to.have.attribute('id', 'MainClass1_MyTestComp');
            expect(select('MAIN_CLASS_LABEL')).to.have.attribute('for', 'MainClass1_MyTestComp');
        });
    });

});
