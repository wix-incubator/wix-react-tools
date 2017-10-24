import {privateState, StateProvider} from "../core/private-state";
import {Class, isAnyClass} from "../core/types";
import {getInheritedClassStateProvider} from "../index";
import {InheritedClassStateProvider} from "../core/class-private-state";


export interface Metadata<D, T extends object> {
    symbols: Function[]; // TODO: Set<Function>? , also better name - taggedWith?
    original: T;
    decoration: D;
}

export type Feature<T extends object> = <T1 extends T>(subj: T1) => T1

/**
 * an instance of this class is a wrapping API for a specific domain
 */
export abstract class DecorApi<D, T extends object> {
    protected readonly metadataProvider: StateProvider<Metadata<D, T>, T>;

    constructor(private id: string) {
        this.metadataProvider = privateState<Metadata<D, T>, T>(id + '-metadata', (targetObj: T) => ({
            original: null as any,
            symbols: [],
            decoration: null as any
        }));
    }

    makeFeatureFactory<C>(getDecoration: (config: C) => D): (config: C) => Feature<T> {
        const factory = (config: C): Feature<T> => {
            const decoration = getDecoration(config);
            const wrapper = <T1 extends T>(subj: T1): T1 => {
                return this.decorate(decoration, wrappers, subj);
            };
            const wrappers = [factory, wrapper];
            return wrapper;
        };
        return factory;
    }

    makeFeature(wrapperArgs: D): Feature<T> {
        const wrapper = <T1 extends T>(subj: T1): T1 => {
            return this.decorate(wrapperArgs, wrappers, subj);
        };
        const wrappers = [wrapper];
        return wrapper;
    }

    isDecorated(subj: T, featureSymbol?: any): boolean {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            if (!featureSymbol) {
                return metadata.symbols.length > 0;
            } else {
                for (let i = 0; i < metadata.symbols.length; i++) {
                    if (metadata.symbols[i] === featureSymbol) {
                        return true;
                    }
                }
            }
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

    protected decorate<T1 extends T>(decoration: D, featureSymbols: Function[], subj: T1): T1 {
        if (this.metadataProvider.hasState(subj)) {
            // subj is already a product of this wrapping API
            // deconstruct it, merge with arguments and re-wrap the original
            const subjMetadata = this.metadataProvider(subj) as Metadata<D, T1>;
            decoration = this.mergeDecorations(subjMetadata.decoration, decoration);
            subj = subjMetadata.original;
            featureSymbols = subjMetadata.symbols.concat(featureSymbols);
            if (subjMetadata.symbols.length > 0 || featureSymbols.length > 0) {
                // de-dupe featureSymbols array
                featureSymbols = Array.from(new Set(featureSymbols));
            }
            // TODO: if featureSymbols (and / or decoration?) are same as before, return subj (it's already wrapped correctly). opt out (force unique wrapping) with metadata flag.
        }
        const wrapped = this.decorationLogic(subj, decoration);
        // TODO if wrapped === subj, continue? should be declarative configurable?
        const metadata = this.metadataProvider(wrapped);
        metadata.original = subj;
        metadata.symbols = featureSymbols;
        metadata.decoration = decoration;
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
    protected readonly inheritedMetadataProvider: InheritedClassStateProvider<Metadata<D, T>, T & Class<any>> = getInheritedClassStateProvider<Metadata<D, T>, T & Class<any>>(this.metadataProvider);

    protected decorate<T1 extends T>(wrapperArgs: D, wrapperSymbols: Function[], subj: T1): T1 {
        if (isAnyClass(subj) && !this.metadataProvider.hasState(subj)) {
            const parentClass = Object.getPrototypeOf(subj.prototype).constructor;
            const ancestorMetaData = this.inheritedMetadataProvider(parentClass);
            if (ancestorMetaData) {
                wrapperArgs = this.mergeDecorations(ancestorMetaData.decoration, wrapperArgs);
                wrapperSymbols = ancestorMetaData.symbols.concat(wrapperSymbols);
            }
        }
        return super.decorate(wrapperArgs, wrapperSymbols, subj);
    }

    protected isThisDecorated(subj: T): boolean {
        const metadata = super.getMetadata(subj);
        return !!(metadata && metadata.symbols.length > 0);
    }

    protected getMetadata(subj: T): Metadata<D, T> | null {
        if (isAnyClass(subj)) {
            return this.inheritedMetadataProvider(subj);
        } else {
            return super.getMetadata(subj);
        }
    }
}
