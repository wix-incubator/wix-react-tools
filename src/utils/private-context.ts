export function getPrivateContext(targetObj:Object,id:string){
    if (!targetObj.hasOwnProperty(id)) {
        Object.defineProperty(targetObj,id,{value:{},enumerable:false});
    }
    return targetObj[id];
}
