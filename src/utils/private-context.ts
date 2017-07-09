export interface Dictionary {
    [index: string]: any;
}
let internalState: Dictionary = {};

export function initPrivateContext(){
    internalState = {};
}

export function getPrivateContext(id:string){
    if (internalState.hasOwnProperty(id)) {
        return internalState[id];
    }else{
        return undefined;   //TODO wat
    }
}

export function setPrivateContext(id:string,privateContext:any){
    internalState[id] = privateContext;
}
