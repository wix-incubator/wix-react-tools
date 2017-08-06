import {classPrivateState, Class} from "../../src/";
import {expect} from "test-drive";

function emptyState(subj: Class<any>) {
    return {};
}
type State = {
    foo?: string
    bar?: string
};
describe('Class private state', () => {
    const pState0 = classPrivateState<State>('foo', emptyState);
    describe('.inherited', ()=>{
        it('returns state of own class if exists', ()=>{
            class F{}
            pState0(F); // init private state
            expect(pState0.inherited(F)).to.equal(pState0(F))
        });
        it('returns null if no state exists', ()=>{
            class F{}
            class G extends F{}
            expect(pState0.inherited(G)).to.equal(null)
        });
        it('returns state of super class if exists', ()=>{
            class F{}
            class G extends F{}
            pState0(F); // init private state
            expect(pState0.inherited(G)).to.equal(pState0(F))
        });
        it('does not return state of super class if own class has state', ()=>{
            class F{}
            class G extends F{}
            pState0(F); // init private state
            pState0(G); // init private state
            expect(pState0.inherited(G)).to.equal(pState0(G));
            expect(pState0.inherited(G)).to.not.equal(pState0(F));
        });
        describe('.unsafe', ()=>{
            it('returns state of own class if exists', ()=>{
                class F{}
                pState0(F); // init private state
                expect(pState0.inherited.unsafe(F)).to.equal(pState0(F))
            });
            it('throws if no state exists', ()=>{
                class F{}
                class G extends F{}
                expect(() => pState0.inherited.unsafe(G)).to.throw();
            });
            it('returns state of super class if exists', ()=>{
                class F{}
                class G extends F{}
                pState0(F).foo = 'bar'; // init private state
                expect(pState0.inherited.unsafe(G)).to.equal(pState0(F))
            });
            it('does not return state of super class if own class has state', ()=>{
                class F{}
                class G extends F{}
                pState0(F); // init private state
                pState0(G); // init private state
                expect(pState0.inherited.unsafe(G)).to.equal(pState0(G));
                expect(pState0.inherited.unsafe(G)).to.not.equal(pState0(F));
            });
        });
        describe('.hasState', ()=>{
            it('returns true if exists in own class', ()=>{
                class F{}
                pState0(F); // init private state
                expect(pState0.inherited.hasState(F)).to.eql(true);
            });
            it('returns false if no state exists', ()=>{
                class F{}
                class G extends F{}
                expect(pState0.inherited.hasState(G)).to.eql(false)
            });
            it('returns true if exists in super', ()=>{
                class F{}
                class G extends F{}
                pState0(F).foo = 'bar'; // init private state
                expect(pState0.inherited.hasState(G)).to.equal(true)
            })
        })
    });

    describe('.unsafe.inherited', ()=>{
        it('equals .inherited.unsafe', ()=>{
            expect(pState0.unsafe.inherited).to.equal(pState0.inherited.unsafe)
        });
    });
});
