import {FunctionFeatureStub} from "./function-feature-stub";
import {Feature} from "../../src/wrappers/index";
import {expect} from "test-drive";

describe('function decor order', () => {
    const noop = () => {};
    const ffs1 = new FunctionFeatureStub();
    const ffs2 = new FunctionFeatureStub();
    let f1: Feature<Function>;
    let f2: Feature<Function>;

    beforeEach('reset features', () => {
        ffs1.reset();
        ffs2.reset();

        f1 = ffs1.feature();
        f2 = ffs2.feature();
    });

    it('before and after wraps middleware', () => {
        const wrapped = f1(noop);
        wrapped();
        ffs1.expectToHaveBeenCalledOnce();

        expect(ffs1.beforeSpy.firstCall.calledBefore(ffs1.middlewareBeforeSpy.firstCall), 'beforeSpy -> middlewareBeforeSpy').to.equal(true);
        expect(ffs1.middlewareBeforeSpy.firstCall.calledBefore(ffs1.middlewareAfterSpy.firstCall), 'middlewareBeforeSpy -> middlewareAfterSpy').to.equal(true);
        expect(ffs1.middlewareAfterSpy.firstCall.calledBefore(ffs1.afterSpy.firstCall), 'middlewareAfterSpy -> afterSpy').to.equal(true);
    });

    it('naive order works', () => {
        const wrapped1 = f1(f2(noop));
        const wrapped2 = f2(f1(noop));

        wrapped1();
        ffs1.expectToHaveWrapped(ffs2);

        ffs1.reset();
        ffs2.reset();

        wrapped2();
        ffs2.expectToHaveWrapped(ffs1);
    });


    // TODO test custom order
});
