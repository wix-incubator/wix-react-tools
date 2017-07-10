const PRIVATE_CONTEXT = "private-context";
import {getGlobalConfig,setGlobalConfig} from './config';

export const ENUMERABLE_FLAG = 'privateContextEnumerable';
setGlobalConfig({[ENUMERABLE_FLAG]:false}); //default to false

/**
 * Returns a private context per instance, per key.
 * @param targetObj object on which to add private context to. Typically use "this".
 * @param key inside that private context
 * @returns {any} requested private context
 */
export function getPrivateContext(targetObj: object, key: string) {
    const targetObject = targetObj as any;

    if (!targetObject.hasOwnProperty(PRIVATE_CONTEXT)) {
        // create a new private context
        Object.defineProperty(targetObject, PRIVATE_CONTEXT, { value: {}, enumerable: getGlobalConfig()[ENUMERABLE_FLAG] });
    }
    //If key doesn't exist for that instance, create a new object for that key
    if (!(targetObject)[PRIVATE_CONTEXT][key]) {
        //init instance-key
        targetObject[PRIVATE_CONTEXT][key] = {};
    }

    return targetObject[PRIVATE_CONTEXT][key];
}
