export function getPrivateContext(targetObj:any,id:string){
    if (!targetObj.hasOwnProperty(id)) {
        targetObj[id] = {};
    }
    return targetObj[id];
}
