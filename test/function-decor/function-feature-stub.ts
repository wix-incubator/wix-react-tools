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
        this.middlewareBeforeSpy.reset();
        this.middlewareAfterSpy.reset();
        this.beforeSpy.reset();
        this.afterSpy.reset();
    }

    expectToHaveWrapped(other: FunctionFeatureStub){
        expect(other.middlewareBeforeSpy, 'other.middlewareBeforeSpy').to.have.callCount(1);
        expect(other.middlewareAfterSpy, 'other.middlewareAfterSpy').to.have.callCount(1);
        expect(other.beforeSpy, 'other.beforeSpy').to.have.callCount(1);
        expect(other.afterSpy, 'other.afterSpy').to.have.callCount(1);

        expect(this.middlewareBeforeSpy, 'this.middlewareBeforeSpy').to.have.callCount(1);
        expect(this.middlewareAfterSpy, 'this.middlewareAfterSpy').to.have.callCount(1);
        expect(this.beforeSpy, 'this.beforeSpy').to.have.callCount(1);
        expect(this.afterSpy, 'this.afterSpy').to.have.callCount(1);

        expect(this.beforeSpy.firstCall).to.have.been.calledBefore(other.beforeSpy);
        expect(this.middlewareBeforeSpy.firstCall).to.have.been.calledBefore(other.middlewareBeforeSpy);

        expect(this.middlewareAfterSpy.firstCall).to.have.been.calledAfter(other.middlewareAfterSpy);
        expect(this.afterSpy.firstCall).to.have.been.calledAfter(other.afterSpy);
    }
}
