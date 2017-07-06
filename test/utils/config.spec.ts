import {expect} from "test-drive";
import {getGlobalConfig, overrideGlobalConfig, setGlobalConfig, runInContext} from "../../src/utils/config";


const sampleConfig = {
    foo: 'bar',
    biz: {baz: true}
};
const sampleConfig2 = {
    foo2: 'bar',
    biz: {baz2: true}
};
describe('config', () => {
    afterEach('cleanup', () => {
        overrideGlobalConfig({});
    });
    beforeEach('cleanup', () => {
        overrideGlobalConfig({});
    });

    it('setGlobalConfig, getGlobalConfig, overrideGlobalConfig', () => {
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
        setGlobalConfig(sampleConfig);
        const config = getGlobalConfig();
        expect(() => config.biz.baz = 'meep').to.throw();
        expect(config).to.eql(sampleConfig);
    });

    it('throws when type mismatch', () => {
        let adHocConfig = {a: {b: {c: true}}};
        setGlobalConfig(adHocConfig);
        expect(() => setGlobalConfig({a: {b: true}})).to.throw();
        expect(getGlobalConfig()).to.eql(adHocConfig);
        expect(() => setGlobalConfig({a: {b: {c: {d: true}}}})).to.throw();
        expect(getGlobalConfig()).to.eql(adHocConfig);
    });

    describe('runInContext', () => {
        it("overrides config for the supplied method", () => {
            setGlobalConfig(sampleConfig);
            let internalConfig = {};
            runInContext(sampleConfig2, () => {
                internalConfig = getGlobalConfig();
            });
            expect(internalConfig, 'inside runInContext').to.containSubset(sampleConfig2);
            expect(getGlobalConfig(), 'after runInContext'+JSON.stringify(getGlobalConfig())).to.eql(sampleConfig);
        });

        it("cleans up after it\'s done", () => {
            setGlobalConfig(sampleConfig);
            runInContext({}, () => {
                setGlobalConfig(sampleConfig2);
            });
            expect(getGlobalConfig(), 'after runInContext').to.eql(sampleConfig);
        });

        it("propagates errors and cleans up nonetheless", () => {
            const err = Error('fake!');
            setGlobalConfig(sampleConfig);
            expect(() =>
                runInContext({foo: 123}, () => {
                    setGlobalConfig({foo: 456});
                    throw err;
                })).to.throw(err);
            expect(sampleConfig, 'after runInContext').to.eql(sampleConfig);
        });
    });
});
