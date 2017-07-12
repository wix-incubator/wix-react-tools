import * as React from 'react';
import {expect, sinon} from 'test-drive-react';
import {Disposers} from "../../src/";

describe("Disposers", () => {
      it('registers named disposers ', () => {
        const disposables = new Disposers();
        const disposer1 = sinon.spy();
        const disposer2 = sinon.spy();

        disposables.set('key1', disposer1);
        disposables.set('key1', disposer2);
        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(0);

        disposer1.reset();
        disposables.disposeAll();

        expect(disposer1).to.have.callCount(0);
        expect(disposer2).to.have.callCount(1);
    });

    it('registers anonymous disposers ', () => {
        const disposables = new Disposers();
        const disposer1 = sinon.spy();
        const disposer2 = sinon.spy();

        disposables.set(disposer1);
        disposables.set(disposer2);

        expect(disposer1).to.have.callCount(0);
        expect(disposer2).to.have.callCount(0);

        disposables.disposeAll();

        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(1);
    });

    it('disposes multiple disposers ', () => {
        const disposables = new Disposers();
        const disposer1 = sinon.spy();
        const disposer2 = sinon.spy();

        disposables.set('key1', disposer1);
        disposables.set('key2', disposer2);

        disposables.disposeAll();

        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(1);
    });

    it('handles explosives disposers', () => {
        const disposables = new Disposers();
        const error = new Error('Boom');
        const disposer1 = sinon.spy(()=>{throw error});
        const disposer2 = sinon.spy();
        // waiting for console-feng-shui
    //    const consoleStub = sinon.stub(console, 'warn', ()=>{});

        disposables.set('key1', disposer1);
        disposables.set('key2', disposer2);

        disposables.disposeAll();

        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(1);
        expect(disposer2).to.have.been.calledAfter(disposer1);
    //    expect(consoleStub).to.have.been.calledWithExactly(UNCAUGHT_DISPOSER_ERROR_MESSAGE, error);
    });

    it('un-registers specific disposers by key', () => {
        const disposables = new Disposers();
        const disposer1 = sinon.spy();
        const disposer2 = sinon.spy();

        disposables.set('key1', disposer1);
        disposables.set('key2', disposer2);

        disposables.dispose('key1');
        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(0);

        disposer1.reset();
        disposer2.reset();
        disposables.disposeAll();

        expect(disposer1).to.have.callCount(0);
        expect(disposer2).to.have.callCount(1);
    });

    it('un-registers anonymous disposers by returned key', () => {
        const disposables = new Disposers();
        const disposer1 = sinon.spy();
        const disposer2 = sinon.spy();

        const key1 = disposables.set(disposer1);
        disposables.set(disposer2);

        disposables.dispose(key1);
        expect(disposer1).to.have.callCount(1);
        expect(disposer2).to.have.callCount(0);

        disposer1.reset();
        disposer2.reset();
        disposables.disposeAll();

        expect(disposer1).to.have.callCount(0);
        expect(disposer2).to.have.callCount(1);
    });
});
