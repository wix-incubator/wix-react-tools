import {serialize} from "../../src";
import {expect, sinon} from "test-drive-react";

// make a new function
function func() {
    return () => {

    };
}

const ARGS = [1, 2, 3];

describe("serialize", () => {

    it('calls the two handlers with the arguments provided', () => {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const merged = serialize(spy1, spy2);

        // not call handlers in merging phase
        expect(spy1).to.have.callCount(0);
        expect(spy2).to.have.callCount(0);

        merged(...ARGS);
        // call handlers when calling merged function
        expect(spy1).to.have.callCount(1);
        expect(spy1).to.have.calledWithExactly(...ARGS);
        expect(spy2).to.have.callCount(1);
        expect(spy2).to.have.calledWithExactly(...ARGS);
    });

    it('does not cache results', () => {
        const f1 = func();
        const f2 = func();

        expect(serialize(f1, f2)).to.not.equal(serialize(f1, f2)); // notice the use of .equal and *not* .eql
    });

    describe(".cached", () => {
        it('calls the two handlers with the arguments provided', () => {
            const spy1 = sinon.spy();
            const spy2 = sinon.spy();
            const merged = serialize.cached(spy1, spy2);

            // not call handlers in merging phase
            expect(spy1).to.have.callCount(0);
            expect(spy2).to.have.callCount(0);

            merged(...ARGS);
            // call handlers when calling merged function
            expect(spy1).to.have.callCount(1);
            expect(spy1).to.have.calledWithExactly(...ARGS);
            expect(spy2).to.have.callCount(1);
            expect(spy2).to.have.calledWithExactly(...ARGS);
        });
        it('cache results, provide pointer-equal function if given same arguments', () => {
            const f1 = func();
            const f2 = func();

            expect(serialize.cached(f1, f2)).to.equal(serialize.cached(f1, f2)); // notice the use of .equal and *not* .eql
        });

        it('not use cache for different order of same arguments', () => {
            const f1 = func();
            const f2 = func();

            expect(serialize.cached(f1, f2)).to.not.equal(serialize.cached(f2, f1)); // notice the use of .equal and *not* .eql
        });

        it('not use cache for different arguments', () => {
            expect(serialize.cached(func(), func())).to.not.equal(serialize.cached(func(), func())); // notice the use of .equal and *not* .eql
        });
    });
});
