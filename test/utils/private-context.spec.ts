import {expect} from "test-drive";
import {getPrivateContext} from "../../src/utils/private-context";

let ids = ["ID0","ID1"];

const sampleConfig = {
    foo: 'bar',
    biz: {baz: true}
};

const sampleConfig2 = {
    foo2: 'bar',
    biz: {baz2: true}
};

describe('private-context', () => {

    it('serves private context per id per instance',()=>{
        const instance = {};
        getPrivateContext(instance,ids[0]).foo="Hi";
        expect(getPrivateContext(instance,ids[0])).to.eql({foo:"Hi"});
        expect(getPrivateContext(instance,ids[1])).to.eql({});  //Make sure new key generates a new object

        expect(getPrivateContext({},ids[0])).to.eql({});    //Check that new instance doesn't return information given to other instance
    });

    it("doesn't show the added fields on original object",()=>{
        const instance = {};
        getPrivateContext(instance,ids[0]).foo="Hi";

        expect(Object.keys(instance)).to.eql([]);
    });
});
