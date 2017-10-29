import {AfterHook, BeforeHook, FunctionMetaData, MiddlewareHook} from "../../src/functoin-decor/common";
import {sinon} from "test-drive-react";
import {expect} from "test-drive";
import {functionDecor} from "../../src/functoin-decor/index";
import {Feature} from "../../src/wrappers/index";


export class FunctionFeatureStub implements FunctionMetaData {

    public middlewareBeforeSpy = sinon.spy();
    public middlewareAfterSpy = sinon.spy();
    public beforeSpy = sinon.spy();
    public afterSpy = sinon.spy();

    public middleware: MiddlewareHook<any>[] = [(next:Function, args:any) => {
        this.middlewareBeforeSpy();
        next(args);
        this.middlewareAfterSpy();
    }];
    public before: BeforeHook[] = [this.beforeSpy];
    public after: AfterHook<any>[] = [this.afterSpy];

    public feature: Feature<Function> = functionDecor.makeFeature(this);

    constructor(public name = 'stub') {
    }


    reset(){
        // reset spies memory
        this.middlewareBeforeSpy.reset();
        this.middlewareAfterSpy.reset();
        this.beforeSpy.reset();
        this.afterSpy.reset();
        // also reset feature to new object
        this.feature = functionDecor.makeFeature(this);
    }

    expectToHaveBeenCalledOnce(){
        expect(this.middlewareBeforeSpy, 'this.middlewareBeforeSpy').to.have.callCount(1);
        expect(this.middlewareAfterSpy, 'this.middlewareAfterSpy').to.have.callCount(1);
        expect(this.beforeSpy, 'this.beforeSpy').to.have.callCount(1);
        expect(this.afterSpy, 'this.afterSpy').to.have.callCount(1);
    }

    expectToHaveWrapped(other: FunctionFeatureStub){
        this.expectToHaveBeenCalledOnce();
        other.expectToHaveBeenCalledOnce();

        expect(this.beforeSpy.firstCall.calledBefore(other.beforeSpy.firstCall), 'beforeSpy order').to.equal(true);
        expect(this.middlewareBeforeSpy.firstCall.calledBefore(other.middlewareBeforeSpy.firstCall), 'middlewareBeforeSpy order').to.equal(true);
        expect(this.middlewareAfterSpy.firstCall.calledAfter(other.middlewareAfterSpy.firstCall), 'middlewareAfterSpy order').to.equal(true);
        expect(this.afterSpy.firstCall.calledAfter(other.afterSpy.firstCall), 'afterSpy order').to.equal(true);
    }
}
