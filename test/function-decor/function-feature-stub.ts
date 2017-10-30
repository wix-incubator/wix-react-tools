import {AfterHook, BeforeHook, FunctionMetaData, MiddlewareHook} from "../../src/functoin-decor/common";
import {sinon} from "test-drive-react";
import {expect} from "test-drive";
import {functionDecor} from "../../src/functoin-decor/index";
import {Feature} from "../../src/wrappers/feature-manager";


export class FunctionFeatureStub implements FunctionMetaData {

    public middlewareBeforeSpy = sinon.spy();
    public middlewareAfterSpy = sinon.spy();
    public middleware: MiddlewareHook<any>[] = [(next: Function, args: any) => {
        this.middlewareBeforeSpy();
        next(args);
        this.middlewareAfterSpy();
    }];
    public beforeSpy = sinon.spy();
    public before: BeforeHook[] = [this.beforeSpy];
    public afterSpy = sinon.spy();
    public after: AfterHook<any>[] = [this.afterSpy];

    public feature: Feature<Function> = functionDecor.makeFeature(this);

    constructor(public name = 'stub') {
    }


    reset() {
        // reset spies memory
        this.middlewareBeforeSpy.reset();
        this.middlewareAfterSpy.reset();
        this.beforeSpy.reset();
        this.afterSpy.reset();
        // also reset feature to new object
        this.feature = functionDecor.makeFeature(this);
    }

    expectToHaveBeenCalledOnce(msg = '') {
        expect(this.beforeSpy, `${msg} : ${this.name}.beforeSpy`).to.have.callCount(1);
        expect(this.middlewareBeforeSpy, `${msg} : ${this.name}.middlewareBeforeSpy`).to.have.callCount(1);
        expect(this.middlewareAfterSpy, `${msg} : ${this.name}.middlewareAfterSpy`).to.have.callCount(1);
        expect(this.afterSpy, `${msg} : ${this.name}.afterSpy`).to.have.callCount(1);
    }

    expectToHaveWrapped(other: FunctionFeatureStub, msg = '') {
        this.expectToHaveBeenCalledOnce(msg);
        other.expectToHaveBeenCalledOnce(msg);

        expect(this.beforeSpy.firstCall.calledBefore(other.beforeSpy.firstCall), `${msg} : ${this.name}.beforeSpy before ${other.name}.beforeSpy`).to.equal(true);
        expect(this.middlewareBeforeSpy.firstCall.calledBefore(other.middlewareBeforeSpy.firstCall), `${msg} : ${this.name}.middlewareBeforeSpy before ${other.name}.middlewareBeforeSpy`).to.equal(true);
        expect(this.middlewareAfterSpy.firstCall.calledAfter(other.middlewareAfterSpy.firstCall), `${msg} : ${this.name}.middlewareAfterSpy after ${other.name}.middlewareAfterSp`).to.equal(true);
        expect(this.afterSpy.firstCall.calledAfter(other.afterSpy.firstCall), `${msg} : ${this.name}.afterSpy after ${other.name}.afterSpy`).to.equal(true);
    }
}
