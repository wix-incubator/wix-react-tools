import {expect} from "test-drive";
import {getPrivateContext,setPrivateContext,initPrivateContext} from "../../src/utils/private-context";

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

    beforeEach(()=>{
        initPrivateContext();
    });

    it('allows setting and then getting the private context by key', () => {
        setPrivateContext(ids[0],sampleConfig);
        setPrivateContext(ids[1],sampleConfig2);

        expect(getPrivateContext(ids[0]), 'after setting sampleConfig').to.containSubset(sampleConfig);
        expect(getPrivateContext(ids[1]), 'after setting sampleConfig2')
            .to.containSubset(sampleConfig2);
    });

    it('allows init private context',()=>{
        setPrivateContext(ids[0],sampleConfig);
        initPrivateContext();
        expect(getPrivateContext(ids[0])).to.equal(undefined);
    });
});
