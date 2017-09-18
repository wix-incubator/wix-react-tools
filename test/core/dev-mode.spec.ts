import {expect} from "test-drive";
import {devMode, getGlobalConfig, runInContext} from "../../src";
import {overrideGlobalConfig} from "../../src/core/config";

declare const process: { env: any };

describe('dev-mode', () => {
    beforeEach('reset global state', () => {
        overrideGlobalConfig({});
    });

    describe('global config constants', () => {
        it("devMode.ON  sets global config to dev-mode", () => {
            expect(runInContext(devMode.ON, () => {
                return getGlobalConfig().devMode;
            })).to.be.ok
        });

        it("devMode.OFF un-sets global config to dev-mode", () => {
            expect(runInContext(devMode.OFF, () => {
                return getGlobalConfig().devMode;
            })).to.not.be.ok
        });
    });


    describe('process.env', () => {
        it("devMode.ON  sets global config to dev-mode", () => {
            expect(runInContext(devMode.ON, () => {
                return process.env.NODE_ENV;
            })).to.eql('development')
        });

        it("devMode.OFF un-sets global config to dev-mode", () => {
            expect(runInContext(devMode.OFF, () => {
                return process.env.NODE_ENV;
            })).to.eql('production');
        });
    });
});
