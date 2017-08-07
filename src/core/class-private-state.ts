import {Class} from "./types";
import {OptionalStateProvider, privateState, StateProvider, unsafe} from "./private-state";

export interface UnsafeClassStateProvider<P = any, T extends Class<object> = Class<object>> extends StateProvider<P, T> {
    (targetObj: T): P;
    inherited(targetObj: T): P;
    origin: StateProvider<T, T>;
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

export function classPrivateState<P = any, T extends Class<object> = Class<object>>(key: string, initializer: { (targetObj: T): P }): ClassStateProvider<P, T> {
    const result = privateState(key, initializer) as ClassStateProvider<P, T>;
    result.inherited = inheritedState(key, result);
    result.unsafe.inherited = result.inherited.unsafe;
    return result;
}

function inheritedState<P, T extends Class<object>>(key: string, provider: StateProvider<P, T>) {
    const inherited = function getInheritedState(clazz: T) {
        while (clazz as Class<object> !== Object) {
            if (provider.hasState(clazz)) {
                return provider(clazz);
            }
            clazz = Object.getPrototypeOf(clazz.prototype).constructor;
        }
        return null;
    } as InheritedClassStateProvider<P, T>;

    inherited.origin = function getSuperClassWithState<T1 extends T>(clazz: T1) {
        while (clazz as Class<object> !== Object) {
            if (provider.hasState(clazz)) {
                return clazz;
            }
            clazz = Object.getPrototypeOf(clazz.prototype).constructor as T1;
        }
        return null;
    } as StateProvider<T, T>;

    inherited.origin.hasState = inherited.hasState = function hasState(clazz: T) {
        while (clazz as Class<object> !== Object) {
            if (provider.hasState(clazz)) {
                return true;
            }
            clazz = Object.getPrototypeOf(clazz.prototype).constructor;
        }
        return false;
    };

    inherited.unsafe = unsafe(key, inherited) as InheritedClassStateProvider<P, T>['unsafe'];
    inherited.unsafe.origin = inherited.origin.unsafe = unsafe(key, inherited.origin);
    return inherited
}
