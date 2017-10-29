import {privateState, StateProvider} from "../core/private-state";

export interface FeatureMetadata<D, T extends object> {
    feature: Feature<T>;
    decoration: D;
    forceBefore: Array<FeatureOrFactory<T>>;
    symbols: any[];
}

export type Feature<T extends object> = <T1 extends T>(subj: T1) => T1

export type FeatureFactory<T extends object, C> = (config: C) => <T1 extends T>(subj: T1) => T1

export type FeatureOrFactory<T extends object> = Feature<T> | FeatureFactory<T, any>


/** @internal */
export class FeatureManager {
    static readonly instance = new FeatureManager();
    readonly featureMetadataProvider: StateProvider<FeatureMetadata<any, any>, FeatureOrFactory<any>>;
    featureSymbolsReducer = <T extends object>(symbols: Array<any>, feature: Feature<T>) => symbols.concat(this.featureMetadataProvider(feature).symbols);

    // singleton
    private constructor() {
        if (FeatureManager.instance) {
            return FeatureManager.instance;
        }
        this.featureMetadataProvider = privateState<FeatureMetadata<any, any>, FeatureOrFactory<any>>('feature-metadata', (feature: Feature<any>) => ({
            feature: feature,
            decoration: null as any,
            forceBefore: [],
            symbols: [feature],
        }));
    }

    featuresMetaOrderComparator<T extends object>(originalOrder: Array<Feature<T>>) {
        return (aMeta: FeatureMetadata<any, any>, bMeta: FeatureMetadata<any, any>) => {
            for (let i = 0; i < aMeta.forceBefore.length; i++) {
                const forceBefore = aMeta.forceBefore[i];
                if (bMeta.symbols.indexOf(forceBefore) >= 0) {
                    return -1;
                }
            }
            for (let i = 0; i < bMeta.forceBefore.length; i++) {
                const forceBefore = bMeta.forceBefore[i];
                if (aMeta.symbols.indexOf(forceBefore) >= 0) {
                    return 1;
                }
            }
            return originalOrder.indexOf(bMeta.feature) - originalOrder.indexOf(aMeta.feature);
        };
    }

    isConstrained<T extends object>(features: Array<Feature<T>>, symbols: Array<any>) {
        for (let i = 0; i < features.length; i++) {
            const featureMetadata = this.featureMetadataProvider(features[i]);
            for (let j = 0; j < featureMetadata.forceBefore.length; j++) {
                const forceBefore = featureMetadata.forceBefore[j];
                if (symbols.indexOf(forceBefore) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

}
