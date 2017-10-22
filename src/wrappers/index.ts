import {privateState, StateProvider} from "../core/private-state";
import {Class, isAnyClass} from "../core/types";
import {getInheritedClassStateProvider} from "../index";
import {InheritedClassStateProvider} from "../core/class-private-state";

export type Merge<T> = (argsA: T, argsB: T) => T;

export interface Metadata<A, T extends object> {
    symbols: Function[]; // TODO: Set<Function>? , also better name - taggedWith?
    original: T;
    wrapperArgs: A;
}

export type InternalWrapper<A, T extends object> = <T1 extends T>(target: T1, args: A) => T1;

export type Wrapper<T extends object> = <T1 extends T>(subj: T1) => T1

/**
 * an instance of this class is a wrapping API for a specific domain
 */
export abstract class WrapApi<A, T extends object> {
    protected readonly metadataProvider: StateProvider<Metadata<A, T>, T>;

    constructor(private id: string) {
        this.metadataProvider = privateState<Metadata<A, T>, T>(id + '-metadata', (targetObj: T) => ({
            original: null as any,
            symbols: [],
            wrapperArgs: null as any
        }));
    }

    makeWrapperFactory<C>(getWrapperArgs: (config: C) => A): (config: C) => Wrapper<T> {
        const factory = (config: C): Wrapper<T> => {
            const wrapperArgs = getWrapperArgs(config);
            const wrapper = <T1 extends T>(subj: T1): T1 => {
                return this.wrap(wrapperArgs, wrappers, subj);
            };
            const wrappers = [factory, wrapper];
            return wrapper;
        };
        return factory;
    }

    makeWrapper(wrapperArgs: A): Wrapper<T> {
        const wrapper = <T1 extends T>(subj: T1): T1 => {
            return this.wrap(wrapperArgs, wrappers, subj);
        };
        const wrappers = [wrapper];
        return wrapper;
    }

    protected wrap<T1 extends T>(wrapperArgs: A, wrapperSymbols: Function[], subj: T1): T1 {
        if (this.metadataProvider.hasState(subj)) {
            // subj is already a product of this wrapping API
            // deconstruct it, merge with arguments and re-wrap the original
            const subjMetadata = this.metadataProvider(subj) as Metadata<A, T1>;
            wrapperArgs = this.mergeArgs(subjMetadata.wrapperArgs, wrapperArgs);
            subj = subjMetadata.original;
            wrapperSymbols = subjMetadata.symbols.concat(wrapperSymbols);
            if (subjMetadata.symbols.length > 0 || wrapperSymbols.length > 0) {
                // de-dupe wrapperSymbols array
                wrapperSymbols = Array.from(new Set(wrapperSymbols));
            }
            // TODO: if wrapperSymbols (and / or wrapperArgs?) are same as before, return subj (it's already wrapped correctly). opt out (force unique wrapping) with metadata flag.
        }
        const wrapped = this.wrappingLogic(subj, wrapperArgs);
        // TODO if wrapped === subj, continue? should be declarative configurable?
        const metadata = this.metadataProvider(wrapped);
        metadata.original = subj;
        metadata.symbols = wrapperSymbols;
        metadata.wrapperArgs = wrapperArgs;
        return wrapped;
    }

    isWrapped(subj: T, wrapperSymbol?: any): boolean {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            if (!wrapperSymbol) {
                return metadata.symbols.length > 0;
            } else {
                for (let i = 0; i < metadata.symbols.length; i++) {
                    if (metadata.symbols[i] === wrapperSymbol) {
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

    getWrapped(subj: T): T | null {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return metadata.original;
        }
        return null;
    }

    getWrapperArgs(subj: T): A | null {
        const metadata = this.getMetadata(subj);
        if (metadata) {
            return metadata.wrapperArgs;
        }
        return null;
    }

    /**
     * main wrapping logic
     * specific to wrapping domain
     * @param {T1} target thing to wrap
     * @param {A} args arguments of wrapper
     * @returns {T1} wrapped target (or target itself if opt out of wrapping)
     */
    protected abstract wrappingLogic<T1 extends T>(target: T1, args: A): T1;

    /**
     * merge two instances of wrapper arguments into one
     * @param {A} base the pre-existing arguments
     * @param {A} addition new arguments
     * @returns {A} a new arguments object combining both arguments
     */
    protected abstract mergeArgs(base: A, addition: A): A;

    protected getMetadata(subj: T): Metadata<A, T> | null {
        if (this.metadataProvider.hasState(subj)) {
            return this.metadataProvider(subj);
        }
        return null;
    }
}

export abstract class InheritedWrapApi<A, T extends object> extends WrapApi<A, T> {
    protected readonly inheritedMetadataProvider: InheritedClassStateProvider<Metadata<A, T>, T & Class<any>> = getInheritedClassStateProvider<Metadata<A, T>, T & Class<any>>(this.metadataProvider);

    protected wrap<T1 extends T>(wrapperArgs: A, wrapperSymbols: Function[], subj: T1): T1 {
        if (isAnyClass(subj) && !this.metadataProvider.hasState(subj)) {
            const parentClass = Object.getPrototypeOf(subj.prototype).constructor;
            const ancestorMetaData = this.inheritedMetadataProvider(parentClass);
            if (ancestorMetaData) {
                wrapperArgs = this.mergeArgs(ancestorMetaData.wrapperArgs, wrapperArgs);
                wrapperSymbols = ancestorMetaData.symbols.concat(wrapperSymbols);
            }
        }
        return super.wrap(wrapperArgs, wrapperSymbols, subj);
    }

    protected isThisWrapped(subj: T): boolean {
        const metadata = super.getMetadata(subj);
        return !!(metadata && metadata.symbols.length > 0);
    }

    protected getMetadata(subj: T): Metadata<A, T> | null {
        if (isAnyClass(subj)) {
            return this.inheritedMetadataProvider(subj);
        } else {
            return super.getMetadata(subj);
        }
    }
}
