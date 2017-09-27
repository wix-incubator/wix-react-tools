import {expect} from "test-drive";
import {devMode, getGlobalConfig, runInContext, overrideGlobalConfig} from "../../src";

declare const process: { env: any };

describe('dev-mode', () => {
    beforeEach('reset global state', () => {
        overrideGlobalConfig({});
    });

    describe('global config constants', () => {
        it("devMode.ON  sets global config to dev-mode", () => {
            const globalDevMode: boolean | undefined = runInContext(devMode.ON, () => getGlobalConfig().devMode);
            expect(globalDevMode).to.be.ok
        });

        it("devMode.OFF un-sets global config to dev-mode", () => {
            const globalDevMode: boolean | undefined = runInContext(devMode.OFF, () => getGlobalConfig().devMode);
            expect(globalDevMode).to.not.be.ok
        });
    });

    describe('process.env', () => {
        it("devMode.ON  sets global config to dev-mode", () => {
            const nodeEnv = runInContext(devMode.ON, () => process.env.NODE_ENV);
            expect(nodeEnv).to.eql('development')
        });

        it("devMode.OFF un-sets global config to dev-mode", () => {
            const nodeEnv = runInContext(devMode.OFF, () => process.env.NODE_ENV);
            expect(nodeEnv).to.eql('production');
        });

        it("process.env.NODE_ENV is not set to 'production' by default during tests", () => {
            expect(process.env.NODE_ENV).to.not.eql('production');
        });
    });
});
