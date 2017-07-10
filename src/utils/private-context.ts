const PRIVATE_CONTEXT = "private-context";
import {getGlobalConfig,setGlobalConfig} from './config';

export const ENUMERABLE_FLAG = 'privateContextEnumerable';
setGlobalConfig({[ENUMERABLE_FLAG]:false}); //default to false

export function getPrivateContext(targetObj: Object, id: string) {
    if (!targetObj.hasOwnProperty(PRIVATE_CONTEXT)) {
        // create a new private context
        Object.defineProperty(targetObj, PRIVATE_CONTEXT, { value: {}, enumerable: getGlobalConfig()[ENUMERABLE_FLAG] });
    }
    //If key doesn't exist for that instance, create a new object for that key
    if (!targetObj[PRIVATE_CONTEXT][id]) {
        //init instance-key
        targetObj[PRIVATE_CONTEXT][id] = {};
    }

    return targetObj[PRIVATE_CONTEXT][id];
}
