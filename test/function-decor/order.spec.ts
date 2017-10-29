import {FunctionFeatureStub} from "./function-feature-stub";
import {Feature} from "../../src/wrappers/index";
import {expect} from "test-drive";

describe('function decor order', () => {
    const noop = () => {};
    const ffs1 = new FunctionFeatureStub();
    const ffs2 = new FunctionFeatureStub();
    beforeEach('reset features', () => {
        ffs1.reset();
        ffs2.reset();
    });

    it('before and after wraps middleware in same feature', () => {
        const wrapped = ffs1.feature(noop);
        wrapped();
        ffs1.expectToHaveBeenCalledOnce();

        expect(ffs1.beforeSpy.firstCall.calledBefore(ffs1.middlewareBeforeSpy.firstCall), 'beforeSpy -> middlewareBeforeSpy').to.equal(true);
        expect(ffs1.middlewareBeforeSpy.firstCall.calledBefore(ffs1.middlewareAfterSpy.firstCall), 'middlewareBeforeSpy -> middlewareAfterSpy').to.equal(true);
        expect(ffs1.middlewareAfterSpy.firstCall.calledBefore(ffs1.afterSpy.firstCall), 'middlewareAfterSpy -> afterSpy').to.equal(true);
    });

    it('before and after wraps middleware between features', () => {
        const wrapped = ffs1.feature(ffs2.feature(noop));
        wrapped();
        ffs1.expectToHaveBeenCalledOnce();
        ffs2.expectToHaveBeenCalledOnce();

        expect(ffs1.beforeSpy.firstCall.calledBefore(ffs2.middlewareBeforeSpy.firstCall), 'ffs1.beforeSpy -> ffs2.middlewareBeforeSpy').to.equal(true);
        expect(ffs2.beforeSpy.firstCall.calledBefore(ffs1.middlewareBeforeSpy.firstCall), 'ffs2.beforeSpy -> ffs1.middlewareBeforeSpy').to.equal(true);
        expect(ffs1.middlewareAfterSpy.firstCall.calledBefore(ffs2.afterSpy.firstCall), 'ffs1.middlewareAfterSpy -> ffs2.afterSpy').to.equal(true);
        expect(ffs2.middlewareAfterSpy.firstCall.calledBefore(ffs1.afterSpy.firstCall), 'ffs2.middlewareAfterSpy -> ffs1.afterSpy').to.equal(true);
    });

    it('naive order works', () => {
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;

        (feature1(feature2(noop)))();
        ffs1.expectToHaveWrapped(ffs2);

        ffs1.reset();
        ffs2.reset();

        (feature2(feature1(noop)))();
        ffs2.expectToHaveWrapped(ffs1);
    });

    it('custom order works', () => {
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;

        (feature1(feature2(noop)))();
        // baseline
        ffs1.expectToHaveWrapped(ffs2);

        ffs1.reset();
        ffs2.reset();

        (feature2(feature1(noop)))();
        // reverse order of feature application, still feature1 wrapped feature2
        ffs1.expectToHaveWrapped(ffs2);
    });
});
