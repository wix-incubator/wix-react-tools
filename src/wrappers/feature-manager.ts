import {privateState, StateProvider} from "../core/private-state";

export interface FeatureMetadata<D, T extends object> {
    feature: Feature<T>;
    decoration: D;
    forceAround: Array<FeatureOrFactory<T>>;
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
            forceAround: [],
            symbols: [feature],
        }));
    }

    /**
     * return the metadata of the supplied features, by the order they should apply
     * (reverse the argument's order, and apply constraints)
     */
    getOrderedMetadata<T extends object>(features: Array<Feature<T>>): Array<FeatureMetadata<any, T>> {
        // bubble sort
        // you have reached the drakest part of the code. as far as dark code go, I think this one is pretty harmless
        const result: Array<FeatureMetadata<any, T>> = [];
        // go over each feature ans add them to the result
        for (let i = features.length - 1; i >= 0; i--) {
            const featureToAdd = this.featureMetadataProvider(features[i]);
            // most features have no special constraints
            if (featureToAdd.forceAround.length) {
                let destinationIdx = 0;
                let searching = true;
                while (searching && (destinationIdx < result.length)) {
                    const otherFeature = result[destinationIdx];
                    let shouldAddBeforeOther = false;
                    for (let k = 0; !shouldAddBeforeOther && k < featureToAdd.forceAround.length; k++) {
                        const forceBefore = featureToAdd.forceAround[k];
                        shouldAddBeforeOther = otherFeature.symbols.indexOf(forceBefore) >= 0;
                    }
                    if (shouldAddBeforeOther) {
                        searching = false;
                    } else {
                        destinationIdx++;
                    }
                }
                // insert featureToAdd before destinationIdx;
                result.splice(destinationIdx, 0, featureToAdd);
            } else {
                result.push(featureToAdd);
            }
        }
        return result;
    }

    isConstrained<T extends object>(features: Array<Feature<T>>, symbols: Array<any>) {
        for (let i = 0; i < features.length; i++) {
            const featureMetadata = this.featureMetadataProvider(features[i]);
            for (let j = 0; j < featureMetadata.forceAround.length; j++) {
                const forceBefore = featureMetadata.forceAround[j];
                if (symbols.indexOf(forceBefore) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

}
