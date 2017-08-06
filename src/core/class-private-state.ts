import {Class} from "./types";
import {unsafe, OptionalStateProvider, privateState, StateProvider} from "./private-state";

export interface UnsafeClassStateProvider<P = any, T extends Class<object> = Class<object>> extends StateProvider<P, T>{
    (targetObj: T): P;
    inherited(targetObj: T): P;
}
/**
 * provides a private state for a supplied class. initializes a new state if none exists.
 * @param targetObj object to which the private state is affiliated.
 */
export interface ClassStateProvider<P = any, T extends Class<object> = Class<object>> extends StateProvider<P, T>{
    unsafe: UnsafeClassStateProvider<P, T>;
    inherited: OptionalStateProvider<P, T>;
}

export function classPrivateState<P = any, T extends Class<object> = Class<object>>(key: string, initializer: {(targetObj: T): P}): ClassStateProvider<P, T> {
    const result = privateState(key, initializer) as ClassStateProvider<P, T>;
    result.inherited = inheritedState(key, result);
    result.unsafe.inherited = result.inherited.unsafe;
    return result;
}

function inheritedState<P, T extends Class<object>>(key: string, provider : StateProvider<P, T>): OptionalStateProvider<P, T> {
    const result = function getInheritedState(clazz: T) {
        while (clazz as Class<object> !== Object) {
            if (provider.hasState(clazz)) {
                return provider(clazz);
            }
            clazz = Object.getPrototypeOf(clazz.prototype).constructor;
        }
        return null;
    } as OptionalStateProvider<P, T>;

    result.hasState = function hasState(clazz: T) {
        while (clazz as Class<object> !== Object) {
            if (provider.hasState(clazz)) {
                return true;
            }
            clazz = Object.getPrototypeOf(clazz.prototype).constructor;
        }
        return false;
    };
    result.unsafe = unsafe(key, result);
    return result
}
