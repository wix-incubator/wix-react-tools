import {expect} from "test-drive";
import {getPrivateContext, ENUMERABLE_FLAG} from "../../src/utils/private-context";
import {runInContext} from "../../src/utils/config";

let ids = ["ID0","ID1"];

describe('Private context', () => {
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

    it("doesn't create gazillion fields on an instance",()=>{
        runInContext({[ENUMERABLE_FLAG]:true},()=>{
            const instance = {};
            getPrivateContext(instance,ids[0]).foo="Hi";
            getPrivateContext(instance,ids[1]).foo="Bye";

            expect(Object.keys(instance).length).to.eql(1);
        });
    });
});
