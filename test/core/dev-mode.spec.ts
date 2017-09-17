import {expect} from "test-drive";
import {devMode,  runInContext, getGlobalConfig} from "../../src";
import {getProcessEnv} from "../../src/core/dev-mode";

declare const process: {env: any} | undefined;

describe('dev-mode', () => {

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
                return getProcessEnv().NODE_ENV;
            })).to.not.eql('production')
        });

        it("devMode.OFF un-sets global config to dev-mode", () => {
            expect(runInContext(devMode.OFF, () => {
                return getProcessEnv().NODE_ENV;
            })).to.eql('production');
        });
    });
});
