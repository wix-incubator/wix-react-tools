import {FunctionFeatureStub} from "./function-feature-stub";
import {expect} from "test-drive";
import {featuresApi} from "../../src/wrappers/index";

describe('function decor order', () => {
    const noop = () => {
    };
    const ffs1 = new FunctionFeatureStub('1');
    const ffs2 = new FunctionFeatureStub('2');
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

    it('custom order works with custom symbols', () => {
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;
        const marker = {};
        featuresApi.markFeatureWith(feature2, marker);

        featuresApi.forceFeatureOrder(feature1, marker);

        (feature1(feature2(noop)))();
        // baseline
        ffs1.expectToHaveWrapped(ffs2, 'baseline');

        ffs1.reset();
        ffs2.reset();

        (feature2(feature1(noop)))();

        // reverse order of feature application, still feature1 wrapped feature2
        ffs1.expectToHaveWrapped(ffs2, 'custom order');
    });

    it('many features work correctly', () => {
        const ffs0 = new FunctionFeatureStub('0');
        const ffs3 = new FunctionFeatureStub('3');
        const ffs4 = new FunctionFeatureStub('4');
        const ffs5 = new FunctionFeatureStub('5');

        const feature0 = ffs0.feature;
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;
        const feature3 = ffs3.feature;
        const feature4 = ffs4.feature;
        const feature5 = ffs5.feature;


        (feature0(feature1(feature2(feature3(feature4(feature5(noop)))))))();
        // baseline
        ffs0.expectToHaveWrapped(ffs1, 'baseline');
        ffs1.expectToHaveWrapped(ffs2, 'baseline');
        ffs2.expectToHaveWrapped(ffs3, 'baseline');
        ffs3.expectToHaveWrapped(ffs4, 'baseline');
        ffs4.expectToHaveWrapped(ffs5, 'baseline');
    });

    it('custom order does not mess with external features', () => {

        const ffs0 = new FunctionFeatureStub('0');
        const ffs3 = new FunctionFeatureStub('3');

        const feature0 = ffs0.feature;
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;
        const feature3 = ffs3.feature;

        featuresApi.forceFeatureOrder(feature1, feature2);

        (feature0(feature1(feature2(feature3(noop)))))();
        // baseline
        ffs0.expectToHaveWrapped(ffs1, 'baseline');
        ffs1.expectToHaveWrapped(ffs2, 'baseline');
        ffs2.expectToHaveWrapped(ffs3, 'baseline');

        ffs0.reset();
        ffs1.reset();
        ffs2.reset();
        ffs3.reset();

        (feature3(feature2(feature1(feature0(noop)))))();

        // reverse order of feature application, still feature1 wrapped feature2
        ffs3.expectToHaveWrapped(ffs1, 'custom order');
        ffs1.expectToHaveWrapped(ffs2, 'custom order');
        ffs2.expectToHaveWrapped(ffs0, 'custom order');

    });

    it('custom order does not mess with internal features', () => {

        const ffs0 = new FunctionFeatureStub('0');
        const ffs3 = new FunctionFeatureStub('3');

        const feature0 = ffs0.feature;
        const feature1 = ffs1.feature;
        const feature2 = ffs2.feature;
        const feature3 = ffs3.feature;

        featuresApi.forceFeatureOrder(feature0, feature3);

        (feature0(feature1(feature2(feature3(noop)))))();
        // baseline
        ffs0.expectToHaveWrapped(ffs1, 'baseline');
        ffs1.expectToHaveWrapped(ffs2, 'baseline');
        ffs2.expectToHaveWrapped(ffs3, 'baseline');

        ffs0.reset();
        ffs1.reset();
        ffs2.reset();
        ffs3.reset();

        (feature3(feature2(feature1(feature0(noop)))))();


        ffs0.expectToHaveWrapped(ffs3, 'custom order');
        ffs3.expectToHaveWrapped(ffs2, 'custom order');
        ffs2.expectToHaveWrapped(ffs1, 'custom order');


        /*
        // another acceptable form (though breaking backwards compatibility)
        ffs2.expectToHaveWrapped(ffs1, 'custom order');
        ffs1.expectToHaveWrapped(ffs0, 'custom order');
        ffs0.expectToHaveWrapped(ffs3, 'custom order');
        */
    });
});
