import {getGlobalConfig} from "./config";
import {NotNull} from "./types";

export const STATE_DEV_MODE_KEY = "$private-context";
const privates = new WeakMap();

export interface OptionalStateProvider<P extends NotNull, T extends object = any> extends StateProvider<P | null, T> {
    unsafe(targetObj: T): P;
}

export interface StateProvider<P = any, T extends object = any> {
    /**
     * provides a private state for a supplied instance. initializes a new state if none exists.
     * @param targetObj object to which the private state is affiliated.
     */
    (targetObj: T): P;

    /**
     * provides a private state for a supplied instance. throws an error if none exists.
     * @param targetObj object to which the private state is affiliated.
     */
    unsafe(targetObj: T): P;

    /**
     * checks whether an instance has a private state associated with it. does not initialize a new state.
     * @param targetObj object to which a private state may be affiliated.
     */
    hasState(targetObj: T): boolean;
}

/**
 * Returns a function that provides a private state per instance.
 * @param key a unique identifier for the provider
 * @param initializer {{(targetObj: T): P}} initializer of a new private state.
 * @returns {StateProvider<P, T>} Provider for the private state object.
 */
export function privateState<P = any, T extends object = any>(key: string, initializer: { (targetObj: T): P }): StateProvider<P, T> {
    const result = function getPrivateState(targetObj: T) {
        let stateContext: { [key: string]: P } = getStateContext(targetObj, true);
        // If key doesn't exist for that instance, create a new object for that key
        if (!stateContext[key]) {
            // init instance-key
            stateContext[key] = initializer(targetObj);
        }
        return stateContext[key];
    } as StateProvider<P, T>;

    result.hasState = function hasState(targetObj: T): boolean {
        let stateContext = getStateContext(targetObj, false);
        return null !== stateContext && undefined !== stateContext[key];
    };
    result.unsafe = unsafe(key, result);
    return result
}

/**
 * @internal
 */
export function unsafe<P, T extends object>(key: string, provider: OptionalStateProvider<P, T>) {
    return function unsafe(clazz: T) {
        if (provider.hasState(clazz)) {
            return provider(clazz) as P;
        }
        throw new Error(`unexpected: ${clazz} does not have private '${key}' field`);
    };
}

/**
 * @internal
 * provides a store for private states, affiliated with the instance
 * @param targetObj object to which a store may be affiliated.
 * @param initIfNone initialize a new store if none is affilitated with targetObj
 * @returns a context, or null if none existed and initIfNone was set to false
 */
function getStateContext<T extends object = any>(targetObj: T, initIfNone: true): { [key: string]: any };
function getStateContext<T extends object = any>(targetObj: T, initIfNone: false): { [key: string]: any } | null;
function getStateContext<T extends object = any>(targetObj: T, initIfNone: boolean): { [key: string]: any } | null {
    let privateContext: { [key: string]: any } | null = null;
    if (privates.has(targetObj)) {
        privateContext = privates.get(targetObj);
        if (getGlobalConfig().devMode) {
            if (!targetObj.hasOwnProperty(STATE_DEV_MODE_KEY)) {
                Object.defineProperty(targetObj, STATE_DEV_MODE_KEY, {value: privateContext});
            }
        }
    } else if (initIfNone) {
        privates.set(targetObj, privateContext = {});
        if (getGlobalConfig().devMode) {
            Object.defineProperty(targetObj, STATE_DEV_MODE_KEY, {value: privateContext});
        }
    }
    return privateContext;
}
