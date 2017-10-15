import {privateState, StateProvider} from "../core/private-state";

export type Merge<T> = (argsA: T, argsB: T) => T;

export interface Metadata<A, T extends object> {
    wrappers: Function[]; // TODO: Set<Function>? , also better name - taggedWith?
    original: T;
    wrapperArgs: A;
}

export type InternalWrapper<A, T extends object> = <T1 extends T>(target: T1, args: A) => T1;

export type Wrapper<T extends object> = <T1 extends T>(func: T1) => T1

/**
 * an instance of this class is a wrapping API for a specific domain
 */
export class WrapApi<A, T extends object> {
    private readonly metadataProvider: StateProvider<Metadata<A, T>, T>;

    constructor(private id: string, private wrapper: InternalWrapper<A, T>, private merge: Merge<A>) {
        this.metadataProvider = privateState<Metadata<A, T>, T>(id+'-metadata', (targetObj: T) => ({
            original: null as any,
            wrappers: [],
            wrapperArgs: null as any
        }));
    }

    makeWrapper(hooks: A): Wrapper<T> {
        const wrapper = <T1 extends T>(subj: T1): T1 => {
            return this.wrap(hooks, wrappers, subj);
        };
        const wrappers = [wrapper];
        return wrapper;
    }

    wrap<T1 extends T>(wrapperArgs: A, wrappers: Function[], subj: T1) : T1 {
        if (this.metadataProvider.hasState(subj)) {
            // subj is already a product of this wrapping API
            // deconstruct it, merge with arguments and re-wrap the original
            const subjMetadata = this.metadataProvider(subj) as Metadata<A, T1>;
            wrapperArgs = this.merge(subjMetadata.wrapperArgs, wrapperArgs);
            subj = subjMetadata.original;
            wrappers = subjMetadata.wrappers.concat(wrappers);
            if (subjMetadata.wrappers.length > 0 || wrappers.length > 0){
                // de-dupe wrappers array
                wrappers = Array.from(new Set(wrappers));
            }
            // TODO: if wrappers (and / or wrapperArgs?) are same as before, return subj (it's already wrapped correctly). opt out (force unique wrapping) with metadata flag.
        }
        const wrapped = this.wrapper(subj, wrapperArgs);
        const metadata = this.metadataProvider(wrapped);
        metadata.original = subj;
        metadata.wrappers = wrappers;
        metadata.wrapperArgs = wrapperArgs;
        return wrapped;
    }

    isWrapped(subj: T, wrapper?: any): boolean {
        if (this.metadataProvider.hasState(subj)) {
            const metadata = this.metadataProvider(subj);
            if (!wrapper) {
                return metadata.wrappers.length > 0;
            } else {
                for (let i = 0; i < metadata.wrappers.length; i++) {
                    if (metadata.wrappers[i] === wrapper) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    normalize(subj: T): T {
        if (this.metadataProvider.hasState(subj)) {
            return this.metadataProvider(subj).original;
        }
        return subj;
    }

    getWrapped(subj: T): T | null {
        if (this.metadataProvider.hasState(subj)) {
            return this.metadataProvider(subj).original;
        }
        return null;
    }

    getMetadata(subj: T): Metadata<A, T> | null {
        if (this.metadataProvider.hasState(subj)) {
            return this.metadataProvider(subj);
        }
        return null;
    }
}
