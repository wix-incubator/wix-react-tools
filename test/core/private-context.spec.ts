import {expect} from "test-drive";
import {getPrivateContext, GlobalConfig, runInContext, STATE_DEV_MODE_KEY} from "../../src";

let ids = ["ID0", "ID1"];
type State = { foo?: string };
describe('Private context', () => {
    it('serves private context per id per instance', () => {
        const instance = {};
        getPrivateContext<State>(instance, ids[0]).foo = "Hi";
        expect(getPrivateContext<State>(instance, ids[0])).to.eql({foo: "Hi"});
        expect(getPrivateContext<State>(instance, ids[1])).to.eql({});  //Make sure new key generates a new object

        expect(getPrivateContext<State>({}, ids[0])).to.eql({});    //Check that new instance doesn't return information given to other instance
    });

    it("doesn't show the added fields on original object", () => {
        const instance = {};
        getPrivateContext<State>(instance, ids[0]).foo = "Hi";

        expect(Object.keys(instance)).to.eql([]);
    });

    it("doesn't create gazillion fields on an instance", () => {
        runInContext<GlobalConfig>({devMode: true}, () => {
            const instance = {};
            getPrivateContext<State>(instance, ids[0]).foo = "Hi";
            getPrivateContext<State>(instance, ids[1]).foo = "Bye";

            expect(Object.keys(instance).length).to.be.lessThan(2);
        });
    });

    it("in dev mode, expose an instance's private context but doesn't let you change it", () => {
        runInContext<GlobalConfig>({devMode: true}, () => {
            const instance = {};
            getPrivateContext<State>(instance, ids[0]).foo = "Hi";

            const desc = Object.getOwnPropertyDescriptor(instance, STATE_DEV_MODE_KEY);
            expect(desc).to.containSubset({writable: false, configurable: false});
        });
    });

    it("outside dev mode, do not expose an instance's private context ", () => {
        runInContext<GlobalConfig>({devMode: false}, () => {
            const instance = {};
            getPrivateContext<State>(instance, ids[0]).foo = "Hi";

            expect(instance.hasOwnProperty(STATE_DEV_MODE_KEY)).to.eql(false);
            expect((instance as any)[STATE_DEV_MODE_KEY]).to.equal(undefined);
        });
    });
});
