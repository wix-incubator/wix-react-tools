let enumerableFlag = false;

/** @internal */
export function setEnumerable(newMode:boolean){
    enumerableFlag = newMode;
}

export function getPrivateContext(targetObj:Object,id:string){
    if (!targetObj.hasOwnProperty(id)) {
        Object.defineProperty(targetObj,id,{value:{},enumerable:enumerableFlag});
    }
    return targetObj[id];
}
