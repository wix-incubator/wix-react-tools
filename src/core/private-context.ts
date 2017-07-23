import {getGlobalConfig} from "./config";
import {GlobalConfig} from "./types";


export const STATE_DEV_MODE_KEY = "$private-context";
const privates = new WeakMap();
/**
 * Returns a private context per instance, per key.
 * @param targetObj object on which to add private context to. Typically use "this".
 * @param key inside that private context
 * @returns {any} the requested private context object. This object is essentially an empty {} until it gets fields inserted into it
 */
export function getPrivateContext<T extends object = any>(targetObj: object, key: string): T {
    let privateContext: { [key: string]: T };
    if (getGlobalConfig<GlobalConfig>().devMode) {
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
        privateContext[key] = {} as T;
    }
    return privateContext[key];
}
