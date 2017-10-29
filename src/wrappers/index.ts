import {privateState, StateProvider} from "../core/private-state";
import {Class, isAnyClass} from "../core/types";
import {addClassMethodsToPrivateState, InheritedClassStateProvider} from "../core/class-private-state";
import {Feature, FeatureFactory, FeatureManager, FeatureOrFactory} from "./feature-manager";


export interface Metadata<D, T extends object> {
    features: Array<Feature<T>>;
    original: T;
    decoration: D;
    symbols: any[]; // TODO: WeakSet
}

export const featuresApi = {

    forceFeatureOrder(before: FeatureOrFactory<any>, after: any) {
        FeatureManager.instance.featureMetadataProvider(before).forceBefore.push(after);
    },

    addSymbolToFeature(feature: FeatureOrFactory<any>, symbol: any): void {
        FeatureManager.instance.featureMetadataProvider(feature).symbols.push(symbol);
    },
};
/**
 * an instance of this class is a wrapping API for a specific domain
 */
export abstract class DecorApi<D, T extends object> {
    protected readonly metadataProvider: StateProvider<Metadata<D, T>, T>;

    constructor(private id: string) {
        this.metadataProvider = privateState<Metadata<D, T>, T>(id + '-metadata', (targetObj: T) => ({
            original: null as any,
            features: [],
            symbols: [],
            decoration: null as any,
        }));
    }

    makeFeatureFactory<C>(getDecoration: (config: C) => D): FeatureFactory<T, C> {
        const that = this;
        const factory = function factory(): Feature<T> {
            const decoration = getDecoration.apply(null, arguments);
            const feature = that.makeFeature(decoration);
            const featureMetadata = FeatureManager.instance.featureMetadataProvider(feature);
            featureMetadata.symbols.push(factory);
            featureMetadata.forceBefore.push(...factoryMetadata.forceBefore);
            return feature;
        } as FeatureFactory<T, C>;
        const factoryMetadata = FeatureManager.instance.featureMetadataProvider(factory);
        factoryMetadata.symbols.push(factory);
        return factory;
    }

    makeFeature(wrapperArgs: D): Feature<T> {
        const feature = <T1 extends T>(subj: T1): T1 => {
            return this.decorate(wrapperArgs, features, subj);
        };
        const features = [feature]; // save creating an extra array on each invocation of feature
        const featureMetadata = FeatureManager.instance.featureMetadataProvider(feature);
        featureMetadata.decoration = wrapperArgs;
        return feature;
    }

    isDecorated(subj: T, featureSymbol?: any): boolean {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return !featureSymbol || metadata.symbols.indexOf(featureSymbol) >= 0;
        }
        return false;
    }

    normalize(subj: T): T {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return metadata.original;
        }
        return subj;
    }

    getOriginal(subj: T): T | null {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return metadata.original;
        }
        return null;
    }

    getDecoration(subj: T): D | null {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return metadata.decoration;
        }
        return null;
    }

    protected decorate<T1 extends T>(decoration: D, features: Array<Feature<T>>, subj: T1): T1 {
        let symbols = features.reduce<Array<any>>(FeatureManager.instance.featureSymbolsReducer, []);
        if (this.metadataProvider.hasState(subj)) {
            // subj is already a product of this wrapping API
            // deconstruct it, merge with arguments and re-wrap the original
            const subjMetadata = this.metadataProvider(subj) as Metadata<D, T1>;
            subj = subjMetadata.original;
            if (FeatureManager.instance.isConstrained(features, subjMetadata.symbols) || FeatureManager.instance.isConstrained(subjMetadata.features, symbols)) {
                // order constraints are in play. apply all features by order
                const newFeatures = [...subjMetadata.features, ...features];
                const orderedFeaturesMeta = newFeatures.map(FeatureManager.instance.featureMetadataProvider).sort(FeatureManager.instance.featuresMetaOrderComparator(newFeatures));
                decoration = orderedFeaturesMeta[0].decoration;
                features = [orderedFeaturesMeta[0].feature];
                symbols = orderedFeaturesMeta[0].symbols;
                for (let i = 1; i < orderedFeaturesMeta.length; i++) {
                    decoration = this.mergeDecorations(orderedFeaturesMeta[i].decoration, decoration);
                    features.push(orderedFeaturesMeta[i].feature);
                    symbols = orderedFeaturesMeta[i].symbols.concat(symbols);
                }
            } else {
                decoration = this.mergeDecorations(subjMetadata.decoration, decoration);
                features = subjMetadata.features.concat(features);
                symbols = subjMetadata.symbols.concat(symbols);
            }
            if (subjMetadata.features.length > 0 || features.length > 0) {
                // de-dupe featureSymbols array
                features = Array.from(new Set(features));
            }
            // TODO: if features (and / or decoration?) are same as before, return subj (it's already wrapped correctly). opt out (force unique wrapping) with metadata flag.
        }
        const wrapped = this.decorationLogic(subj, decoration);
        // TODO if wrapped === subj, continue? should be declarative configurable?
        const metadata = this.metadataProvider(wrapped);
        metadata.original = subj;
        metadata.features = features;
        metadata.decoration = decoration;
        metadata.symbols = symbols;
        return wrapped;
    }

    /**
     * main domain logic
     * @param {T1} target thing to decorate
     * @param {D} decoration the argument of decoration
     * @returns {T1} decorated target (wrapper / target)
     */
    protected abstract decorationLogic<T1 extends T>(target: T1, decoration: D): T1;

    /**
     * merge two decorations into one
     * @param {D} base the pre-existing decoration
     * @param {D} addition new decoration
     * @returns {D} a new decoration object combining both decorations
     */
    protected abstract mergeDecorations(base: D, addition: D): D;

    protected getMetadata(subj: T): Metadata<D, T> | null {
        if (this.metadataProvider.hasState(subj)) {
            return this.metadataProvider(subj);
        }
        return null;
    }
}

export abstract class DecorClassApi<D, T extends object> extends DecorApi<D, T> {
    protected readonly inheritedMetadataProvider: InheritedClassStateProvider<Metadata<D, T>, T & Class<any>> = addClassMethodsToPrivateState<Metadata<D, T>, T & Class<any>>(this.metadataProvider).inherited;

    protected decorate<T1 extends T>(wrapperArgs: D, features: Array<Feature<T>>, subj: T1): T1 {
        if (isAnyClass(subj) && !this.metadataProvider.hasState(subj)) {
            const parentClass = Object.getPrototypeOf(subj.prototype).constructor;
            const ancestorMetaData = this.inheritedMetadataProvider(parentClass);
            if (ancestorMetaData) {
                wrapperArgs = this.mergeDecorations(ancestorMetaData.decoration, wrapperArgs);
                features = ancestorMetaData.features.concat(features);
            }
        }
        return super.decorate(wrapperArgs, features, subj);
    }

    protected isThisDecorated(subj: T): boolean {
        const metadata = super.getMetadata(subj);
        return !!(metadata && metadata.features.length > 0);
    }

    protected getMetadata(subj: T): Metadata<D, T> | null {
        if (isAnyClass(subj)) {
            return this.inheritedMetadataProvider(subj);
        } else {
            return super.getMetadata(subj);
        }
    }
}
