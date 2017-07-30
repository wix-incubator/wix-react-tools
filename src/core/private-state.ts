import {getGlobalConfig} from "./config";

export const STATE_DEV_MODE_KEY = "$private-context";
const privates = new WeakMap();

/**
 * a function that provides a private context per instance.
 * @param targetObj object to which the private context is affiliated.
 */
export type StateProvider<P extends object = any, T extends object = any> = (targetObj: T) => P

/**
 * Returns a function that provides a private context per instance.
 * @param key a unique identifier for the provider
 * @param initializer {StateProvider<P, T>} initializer of a new private state.
 * @returns {StateProvider<P, T>} Provider for the private state object.
 */
export function privateState<P extends object = any, T extends object = any>(key: string, initializer: StateProvider<P, T>): StateProvider<P, T> {
    return function (targetObj: T) {
        let privateContext: { [key: string]: P };
        if (getGlobalConfig().devMode) {
            const targetObject = targetObj as any;
            if (targetObject.hasOwnProperty(STATE_DEV_MODE_KEY)) {
                privateContext = targetObject[STATE_DEV_MODE_KEY];
            } else {
                // create a new private context
                Object.defineProperty(targetObject, STATE_DEV_MODE_KEY, {value: privateContext = {}});
            }
        } else {
            if (privates.has(targetObj)) {
                privateContext = privates.get(targetObj);
            } else {
                privates.set(targetObj, privateContext = {});
            }
        }

        // If key doesn't exist for that instance, create a new object for that key
        if (!privateContext[key]) {
            // init instance-key
            privateContext[key] = initializer(targetObj);
        }
        return privateContext[key];
    }
}
