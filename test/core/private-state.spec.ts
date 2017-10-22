import {expect} from "test-drive";
import {devMode, privateState, runInContext, STATE_DEV_MODE_KEY} from "../../src";

let ids = ["ID0", "ID1", "ID2"];

function emptyState(_: any) {
    return {};
}

type State = {
    foo?: string
    bar?: string
};

describe('Private state', () => {
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
        expect(pState1(instance), 'new key generates a new object').to.eql({});

        const instance2 = {};
        expect(pState0(instance2), `instance doesn't have information given to other instance`).to.eql({});
    });

    it("doesn't show the added fields on original object", () => {
        const instance = {};
        pState0(instance).foo = "Hi";

        expect(Object.keys(instance)).to.eql([]);
    });

    it("doesn't create gazillion fields on an instance", () => {
        runInContext(devMode.ON, () => {
            const instance = {};
            pState0(instance).foo = "Hi";
            pState1(instance).foo = "Bye";

            expect(Object.keys(instance).length).to.be.lessThan(2);
        });
    });

    it("allows initializing (and prototype inheritance) between states", () => {
        const instance = {};
        expect(pState2(instance)).to.eql({foo: "bar"});
        pState1(instance).bar = "Hi";
        expect(pState2(instance)).to.eql({foo: "bar", bar: "Hi"});
    });

    describe('dev mode', () => {

        it("in dev mode, expose an instance's private state but doesn't let you change it", () => {
            runInContext(devMode.ON, () => {
                const instance = {};
                pState0(instance).foo = "Hi";

                const desc = Object.getOwnPropertyDescriptor(instance, STATE_DEV_MODE_KEY);
                expect(desc).to.containSubset({writable: false, configurable: false});
            });
        });

        it("outside dev mode, do not expose an instance's private state ", () => {
            runInContext(devMode.OFF, () => {
                const instance = {};
                pState0(instance).foo = "Hi";

                expect(instance.hasOwnProperty(STATE_DEV_MODE_KEY)).to.eql(false);
                expect((instance as any)[STATE_DEV_MODE_KEY]).to.equal(undefined);
            });
        });

        it("state initialized out of dev mode still available in dev mode", () => {
            const instance = {};
            runInContext(devMode.OFF, () => {
                pState0(instance).foo = "Hi";
            });
            runInContext(devMode.ON, () => {
                expect(pState0(instance)).to.eql({foo: "Hi"});
            });
        });

        it("state initialized in dev mode still available out of dev mode", () => {
            const instance = {};
            runInContext(devMode.ON, () => {
                pState0(instance).foo = "Hi";
            });
            runInContext(devMode.OFF, () => {
                expect(pState0(instance)).to.eql({foo: "Hi"});
            });
        });

        it("after fetching in dev mode, expose an instance's private state even if initialized outside dev mode", () => {
            const instance = {};
            runInContext(devMode.OFF, () => {
                pState0(instance).foo = "Hi";
            });
            runInContext(devMode.ON, () => {
                pState1(instance); // fetch once in dev mode, not even the state in question
                const desc = Object.getOwnPropertyDescriptor(instance, STATE_DEV_MODE_KEY);
                expect(desc).to.containSubset({writable: false, configurable: false});
                expect((instance as any)[STATE_DEV_MODE_KEY][ids[0]]).to.equal(pState0(instance));
            });
        });
    });

    describe('.hasState', () => {
        it('reflects existence of private state per id per instance', () => {
            const instance = {};
            expect(pState0.hasState(instance)).to.eql(false);
            pState0(instance);
            expect(pState0.hasState(instance)).to.eql(true);
            expect(pState1.hasState(instance)).to.eql(false);
        });
        it('does not change the original instance', () => {
            runInContext(devMode.OFF, () => {
                const instance = {};
                pState0.hasState(instance);
                expect(instance).to.eql({});
            });
        });
        it('in dev mode, does not change the original instance', () => {
            runInContext(devMode.ON, () => {
                const instance = {};
                pState0.hasState(instance);
                expect(instance).to.eql({});
            });
        });
    });

    describe('.unsafe', () => {
        it('returns state of own class if exists', () => {
            const instance = {};
            pState0(instance); // init private state
            expect(pState0.unsafe(instance)).to.equal(pState0(instance))
        });
        it('throws if no state exists', () => {
            const instance = {};
            expect(() => pState0.unsafe(instance)).to.throw();
        });
        it('does not change the original instance', () => {
            runInContext(devMode.OFF, () => {
                const instance = {};
                try {
                    pState0.unsafe(instance);
                } catch (e) {

                }
                expect(instance).to.eql({});
            });
        });
        it('in dev mode, does not change the original instance', () => {
            runInContext(devMode.ON, () => {
                const instance = {};
                try {
                    pState0.unsafe(instance);
                } catch (e) {

                }
                expect(instance).to.eql({});
            });
        });
    });
});
