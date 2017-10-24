import {Class} from "./types";
import {OptionalStateProvider, privateState, StateProvider, unsafe} from "./private-state";

export interface UnsafeClassStateProvider<P = any, T extends Class<object> = Class<object>> extends StateProvider<P, T> {
    origin: StateProvider<T, T>;

    (targetObj: T): P;

    inherited(targetObj: T): P;
}

export interface InheritedClassStateProvider<P, T extends Class<object> = Class<object>> extends OptionalStateProvider<P, T> {
    origin: OptionalStateProvider<T, T>;
    unsafe: {
        (targetObj: T): P;
        origin(targetObj: T): T;
    }
}

/**
 * provides a private state for a supplied class. initializes a new state if none exists.
 * @param targetObj object to which the private state is affiliated.
 */
export interface ClassStateProvider<P = any, T extends Class<object> = Class<object>> extends StateProvider<P, T> {
    inherited: InheritedClassStateProvider<P, T>;
    unsafe: UnsafeClassStateProvider<P, T>;
}

function makeHeritageProvider<P, T extends Class<object>>(provider: StateProvider<P, T>): (clazz: T) => InheritedState<P, T> {
    const internal: StateProvider<InheritedState<P, T>, T> = privateState('inherited-' + provider.stateId, (clazz: T) => {
        if (clazz as Class<object> === Object) {
            return {origin: null, value: null};
        }
        if (provider.hasState(clazz)) {
            return {origin: clazz, value: provider(clazz)};
        }
        return internal(Object.getPrototypeOf(clazz.prototype).constructor);
    });
    return internal;
}

export function addClassMethodsToPrivateState<P, T extends Class<object>>(provider: StateProvider<P, T>): ClassStateProvider<P, T> {
    const classProvider = provider as ClassStateProvider<P, T>;
    if (typeof classProvider.inherited === 'function') {
        return classProvider;
    }
    const heritageProvider = makeHeritageProvider(provider);
    // construct the inherited methods
    const inherited = ((clazz: T) => heritageProvider(clazz).value)  as InheritedClassStateProvider<P, T>;
    inherited.origin = ((clazz: T) => heritageProvider(clazz).origin) as StateProvider<T, T>;
    inherited.origin.hasState = inherited.hasState = ((clazz: T) => heritageProvider(clazz).origin !== null);
    inherited.unsafe = unsafe(provider.stateId, inherited) as InheritedClassStateProvider<P, T>['unsafe'];
    inherited.unsafe.origin = inherited.origin.unsafe = unsafe(provider.stateId, inherited.origin);
    classProvider.inherited = inherited;
    classProvider.unsafe.inherited = classProvider.inherited.unsafe;
    return classProvider
}

type InheritedState<P, T extends Class<object>> = {
    origin: T | null;
    value: P | null;
}

export function classPrivateState<P = any, T extends Class<object> = Class<object>>(key: string, initializer: { (targetObj: T): P }): ClassStateProvider<P, T> {
    return addClassMethodsToPrivateState(privateState(key, initializer));
}
