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
        beforeEach('reset config to sampleConfig', () => {
            setGlobalConfig(sampleConfig);
        });
        it("returns result of internal method", () => {
            const res = {};
            expect(runInContext({}, () => res)).to.equal(res);
        });

        it("if method throws, propagates errors and cleans", () => {
            const err = Error('fake!');
            expect(() =>
                runInContext({foo: 123}, () => {
                    setGlobalConfig({foo: 456});
                    throw err;
                })).to.throw(err);
            expect(sampleConfig, 'after runInContext').to.eql(sampleConfig);
        });

        it("overrides config for the supplied method only", () => {
            expect(getGlobalConfig(), 'before runInContext').to.eql(sampleConfig);
            runInContext(sampleConfig2, () => {
                expect(getGlobalConfig(), 'inside runInContext').to.containSubset(sampleConfig2);
            });
            expect(getGlobalConfig(), 'after runInContext').to.eql(sampleConfig);
        });

        it("cleans up changes made by the method after it\'s done", () => {
            runInContext({}, () => {
                setGlobalConfig(sampleConfig2);
            });
            expect(getGlobalConfig(), 'after runInContext').to.eql(sampleConfig);
        });

        it("if method throws in test mode, propagates errors and cleans up", () => {
            const err = Error('fake!');
            expect(() =>
                runInContext({foo: 123}, () => {
                    setGlobalConfig({foo: 456});
                    throw err;
                }, true)).to.throw(err);
            expect(sampleConfig, 'after runInContext').to.eql(sampleConfig);
        });

        it("if method returns promise in test mode, cleans up only afterwards", () => {
            const delay = new Promise(resolve => setTimeout(() => resolve(), 10));
            const res = runInContext(sampleConfig2, () => delay, true);
            expect(getGlobalConfig(), 'after runInContext but before promise is done').to.containSubset(sampleConfig2);
            return res.then(() => {
                expect(getGlobalConfig(), 'after promise is done').to.eql(sampleConfig);
            });
        });

        it("if method returns promise in test mode, cleans up afterwards even if promise rejects", () => {
            const err = Error('fake!');
            const delay = new Promise(resolve => setTimeout(() => resolve(), 10)).then(() => {
                throw err;
            });

            return runInContext(sampleConfig2, () => delay, true).then(() => {
                throw new Error('promise should have rejected');
            }, (reason: any) => {
                expect(reason, 'thrown').to.equal(err);
                expect(getGlobalConfig(), 'after promise rejected').to.eql(sampleConfig);
            });
        });
    });
});
