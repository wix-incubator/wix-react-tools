import {hello, helloObj} from "../src/greeter";
import {expect} from 'chai';
import * as sinon from 'sinon';


const NAME = 'Joe';
const PLACEHOLDER = 'placeholder';


describe('greeter', () => {
    // simple unit test
    it('greets', ()=>{
        expect(hello(NAME).toLowerCase()).to.equal('hello joe');
    });

    //more complex unit test
    it('produces object', ()=>{
        const mySpy = sinon.spy(()=>PLACEHOLDER);
        const result = helloObj(NAME, mySpy);

        expect(mySpy).to.have.callCount(1);
        expect(mySpy).to.have.been.calledWith(NAME);
        expect(result).to.containSubset({greet:PLACEHOLDER});
    });

    // integration test
    it('object works with provided greeter', ()=>{
        expect(helloObj(NAME, hello)).to.containSubset({greet:'Hello Joe'});
    });

});
