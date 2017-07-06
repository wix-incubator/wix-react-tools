import { ifndef } from 'ifndef'
function deepFrozenClone(obj:Dictionary):Readonly<Dictionary>  {
    const propNames = Object.keys(obj);
    const clone:Dictionary = {};
    propNames.forEach(function(name) {
        let prop = obj[name];
        if (typeof prop == 'object' && prop !== null) {
            clone[name] = deepFrozenClone(prop);
        } else {
            clone[name] = prop;
        }
    });
    return Object.freeze(clone);
}

function deepMerge(dest:Dictionary, src:Dictionary, path:string[] = []):void {
    const propNames = Object.keys(src);
    propNames.forEach(function(name) {
        let destProp = dest[name];
        let srcProp = src[name];
        if (destProp) {
            const newPath = [...path, name];
            if (typeof destProp == 'object' && typeof srcProp == 'object') {
                deepMerge(destProp, srcProp, [...path, name]);
            } else {
                throw Error(`type mismatch at ${newPath.join('.')}: existing field is ${destProp} and new field is ${srcProp}`);
            }
        } else {
            dest[name] = srcProp;
        }
    });
}

export interface Dictionary {
    [index: string]: any;
}
let internalState:Dictionary = {};

let dirty = true;

let publicState:Readonly<Dictionary> = {};


export function overrideGlobalConfig(config:Dictionary):void{
    internalState = {...config};
    dirty = true;
}

export function setGlobalConfig(config:Dictionary):void{
    deepMerge(internalState, config);
    dirty = true;
}

export function getGlobalConfig<T extends object = Dictionary>():T{
    if (dirty){
        publicState = deepFrozenClone(internalState);
    }
    return publicState as T;
}

declare let module:any;
module.exports = ifndef('rect-base-global-config', module.exports);
