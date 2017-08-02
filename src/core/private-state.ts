import {getGlobalConfig} from "./config";

export const STATE_DEV_MODE_KEY = "$private-context";
const privates = new WeakMap();

/**
 * a function that provides a private state per instance. initializes a new state if none exists.
 * @param targetObj object to which the private state is affiliated.
 */
export interface StateProvider<P extends object = any, T extends object = any>{
    (targetObj: T): P;
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
export function privateState<P extends object = any, T extends object = any>(key: string, initializer: {(targetObj: T): P}): StateProvider<P, T> {
    const result = function getPrivateState(targetObj: T) {
        let privateContext: { [key: string]: P } = getStateContext(targetObj, true);
        // If key doesn't exist for that instance, create a new object for that key
        if (!privateContext[key]) {
            // init instance-key
            privateContext[key] = initializer(targetObj);
        }
        return privateContext[key];
    } as StateProvider<P, T>;

    result.hasState = function hasState(targetObj: T):boolean {
        let stateContext = getStateContext(targetObj, false);
        return null !== stateContext && undefined !== stateContext[key];
    };
    return result
}

/**
 * provides a store for private states, affiliated with the instance
 * @param targetObj object to which a store may be affiliated.
 * @param initIfNone initialize a new store if none is affilitated with targetObj
 * @returns a context, or null if none existed and initIfNone was set to false
 */
function getStateContext<T extends object = any>(targetObj: T, initIfNone:true):{ [key: string]: any };
function getStateContext<T extends object = any>(targetObj: T, initIfNone:false):{ [key: string]: any } | null;
function getStateContext<T extends object = any>(targetObj: T, initIfNone:boolean):{ [key: string]: any } | null {
    let privateContext: { [key: string]: any } | null = null;
    if (getGlobalConfig().devMode) {
        const targetObject = targetObj as any;
        if (targetObject.hasOwnProperty(STATE_DEV_MODE_KEY)) {
            privateContext = targetObject[STATE_DEV_MODE_KEY];
        } else if (initIfNone){
            // create a new private context
            Object.defineProperty(targetObject, STATE_DEV_MODE_KEY, {value: privateContext = {}});
        }
    } else {
        if (privates.has(targetObj)) {
            privateContext = privates.get(targetObj);
        } else if (initIfNone){
            privates.set(targetObj, privateContext = {});
        }
    }
    return privateContext;
}
