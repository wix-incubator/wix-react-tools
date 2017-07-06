import {expect} from "test-drive";
import {getGlobalConfig, overrideGlobalConfig, setGlobalConfig} from "../../src/utils/config";


describe('config', () => {

    afterEach('cleanup', () => {
        overrideGlobalConfig({});
    });
    beforeEach('cleanup', () => {
        overrideGlobalConfig({});
    });

    it('setGlobalConfig, getGlobalConfig, overrideGlobalConfig', () => {
        const sampleConfig = {
            foo: 'bar',
            biz: {baz: true}
        };
        const sampleConfig2 = {
            foo2: 'bar',
            biz: {baz2: true}
        };
        setGlobalConfig(sampleConfig);
        expect(getGlobalConfig(), 'after setting sampleConfig').to.containSubset(sampleConfig);
        setGlobalConfig(sampleConfig2);
        expect(getGlobalConfig(), 'after setting sampleConfig2')
            .to.containSubset(sampleConfig).and
            .to.containSubset(sampleConfig2);
        overrideGlobalConfig(sampleConfig);
        expect(getGlobalConfig(), 'after setting sampleConfig').to.containSubset(sampleConfig);
    });

    it('is frozen', () => {
        const config = getGlobalConfig();
        expect(config).to.eql({});
        expect(() => config.foo = 'bar').to.throw();
        expect(config).to.eql({});
    });

    it('is Deeply frozen', () => {
        const sampleConfig = {
            foo: 'bar',
            biz: {baz: true}
        };
        setGlobalConfig(sampleConfig);
        const config = getGlobalConfig();
        expect(() => config.biz.baz = 'meep').to.throw();
        expect(config).to.eql(sampleConfig);
    });

    it('throws when type mismatch', () => {
        let adHocConfig = {a:{b:{c:true}}};
        setGlobalConfig(adHocConfig);
        expect(() => setGlobalConfig({a:{b:true}})).to.throw();
        expect(getGlobalConfig()).to.eql(adHocConfig);
        expect(() => setGlobalConfig({a:{b:{c:{d:true}}}})).to.throw();
        expect(getGlobalConfig()).to.eql(adHocConfig);
    });

});
