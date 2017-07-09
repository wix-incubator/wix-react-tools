import {expect} from "test-drive";
import {getPrivateContext,setPrivateContext} from "../../src/utils/private-context";

const sampleConfig = {
    foo: 'bar',
    biz: {baz: true}
};

const sampleConfig2 = {
    foo2: 'bar',
    biz: {baz2: true}
};

describe('private-context', () => {
    it('setPrivateContext, getPrivateContext', () => {
        setPrivateContext("ID0",sampleConfig);
        expect(getPrivateContext("ID0"), 'after setting sampleConfig').to.containSubset(sampleConfig);
        setPrivateContext("ID1",sampleConfig2);
        expect(getPrivateContext("ID1"), 'after setting sampleConfig2')
            .to.containSubset(sampleConfig2);
    });
});
