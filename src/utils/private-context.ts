import { getGlobalConfig, setGlobalConfig } from "./config";

const PRIVATE_CONTEXT = "private-context";
export const ENUMERABLE_FLAG = "privateContextEnumerable"; // This flag is used to expose private context as a field in the given instance in tests. Modify via config.
setGlobalConfig({ [ENUMERABLE_FLAG]: false }); // default to false

/**
 * Returns a private context per instance, per key.
 * @param targetObj object on which to add private context to. Typically use "this".
 * @param key inside that private context
 * @returns {any} the requested private context object. This object is essentially an empty {} until it gets fields inserted into it
 */
// TODO use global unique key, see https://github.com/wix/react-bases/issues/55
export function getPrivateContext<T extends object = any>(targetObj: object, key: string):T {
    const targetObject = targetObj as any;

    if (!targetObject.hasOwnProperty(PRIVATE_CONTEXT)) {
        // create a new private context
        Object.defineProperty(targetObject, PRIVATE_CONTEXT, { value: {}, enumerable: getGlobalConfig()[ENUMERABLE_FLAG] });
    }
    // If key doesn't exist for that instance, create a new object for that key
    if (!targetObject[PRIVATE_CONTEXT][key]) {
        // init instance-key
        targetObject[PRIVATE_CONTEXT][key] = {};
    }

    return targetObject[PRIVATE_CONTEXT][key];
}
