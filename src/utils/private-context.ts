const PRIVATE_CONTEXT = "private-context";
let enumerableFlag = false;

/** @internal */
export function setEnumerable(newMode:boolean){
    enumerableFlag = newMode;
}

export function getPrivateContext(targetObj:Object,id:string){
    if (!targetObj.hasOwnProperty(PRIVATE_CONTEXT)) {
        // create a new private context
        let newPrivateContext = {};
        newPrivateContext[id] = {};
        Object.defineProperty(targetObj,PRIVATE_CONTEXT,{value:newPrivateContext,enumerable:enumerableFlag});
    }else{
        //If key doesn't exist for that instance, create a new object for that key
        if ((targetObj[PRIVATE_CONTEXT][id]==undefined)){
            targetObj[PRIVATE_CONTEXT][id] = {};
        }
    }
    return targetObj[PRIVATE_CONTEXT][id];
}
