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

    getSortedMetadata<T extends object>(features: Array<Feature<T>>): Array<FeatureMetadata<any, T>> {
        // bubble sort
        const result : Array<FeatureMetadata<any, T>> = [];
        for (let i = features.length - 1; i >= 0; i--) {
            const aMeta = this.featureMetadataProvider(features[i]);
            let j = 0;
            for (; j < result.length; j++) {
                const bMeta = result[j];
                if(aMeta.forceBefore.length && this.isBefore(aMeta, bMeta)){
                    break;
                }
            }
            // insert aMeta before position j;
            result.splice(j,0,aMeta);
        }
        return result;
    }

    isBefore(aMeta: FeatureMetadata<any, any>, bMeta: FeatureMetadata<any, any>): boolean {
        for (let i = 0; i < aMeta.forceBefore.length; i++) {
            const forceBefore = aMeta.forceBefore[i];
            // instead of indexOf
            for (let j = 0; j < bMeta.symbols.length; j++) {
                if (bMeta.symbols[j] === forceBefore){
                    return true;
                }
            }
        }
        return false;
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
