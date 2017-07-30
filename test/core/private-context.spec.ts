import {expect} from "test-drive";
import {privateState, runInContext, STATE_DEV_MODE_KEY} from "../../src";

let ids = ["ID0", "ID1", "ID2"];
function emptyState(subj: any) {
    return {};
}
type State = {
    foo?: string
    bar?: string
};
describe('Private state', () => {
    describe('per ID', () => {
        const pState0 = privateState<State>(ids[0], emptyState);
        const pState1 = privateState<State>(ids[1], emptyState);
        const pState2 = privateState<State>(ids[2], (subj: any) => {
            const result = Object.create(pState1(subj));
            result.foo = 'bar';
            return result;
        });
        it('serves private state per id per instance', () => {
            const instance = {};
            pState0(instance).foo = "Hi";
            expect(pState0(instance)).to.eql({foo: "Hi"});
            expect(pState1(instance)).to.eql({});  //Make sure new key generates a new object

            expect(pState0({})).to.eql({});    //Check that new instance doesn't return information given to other instance
        });

        it("doesn't show the added fields on original object", () => {
            const instance = {};
            pState0(instance).foo = "Hi";

            expect(Object.keys(instance)).to.eql([]);
        });

        it("doesn't create gazillion fields on an instance", () => {
            runInContext({devMode: true}, () => {
                const instance = {};
                pState0(instance).foo = "Hi";
                pState1(instance).foo = "Bye";

                expect(Object.keys(instance).length).to.be.lessThan(2);
            });
        });

        it("in dev mode, expose an instance's private state but doesn't let you change it", () => {
            runInContext({devMode: true}, () => {
                const instance = {};
                pState0(instance).foo = "Hi";

                const desc = Object.getOwnPropertyDescriptor(instance, STATE_DEV_MODE_KEY);
                expect(desc).to.containSubset({writable: false, configurable: false});
            });
        });

        it("outside dev mode, do not expose an instance's private state ", () => {
            runInContext({devMode: false}, () => {
                const instance = {};
                pState0(instance).foo = "Hi";

                expect(instance.hasOwnProperty(STATE_DEV_MODE_KEY)).to.eql(false);
                expect((instance as any)[STATE_DEV_MODE_KEY]).to.equal(undefined);
            });
        });

        it("allows initializing (and prototype inheritance) between states", () => {
            const instance = {};
            expect(pState2(instance)).to.eql({foo:"bar"});
            pState1(instance).bar = "Hi";
            expect(pState2(instance)).to.eql({foo:"bar", bar: "Hi"});
        });
    });
});
