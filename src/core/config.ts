import {ifndef} from 'ifndef'
import {GlobalConfig} from "./types";

export interface Dictionary {
    [index: string]: any;
}
let internalState: Dictionary = {};

let dirty = true;

let publicState: Readonly<Dictionary> = {};


export function overrideGlobalConfig<T extends object = GlobalConfig>(config: T): void {
    internalState = deepClone(config);
    dirty = true;
}

export function setGlobalConfig<T extends object = GlobalConfig>(config: T): void {
    deepMergeClone(internalState, config);
    dirty = true;
}

export function getGlobalConfig<T extends object = GlobalConfig>(): T {
    if (dirty) {
        publicState = deepFrozenClone(internalState);
    }
    return publicState as T;
}

export function runInContext<T extends object = GlobalConfig>(config: T, func: Function, test = false) {
    const cleanup = overrideGlobalConfig.bind(null, deepClone(internalState));
    let result: any = null;
    dirty = true;
    try {
        setGlobalConfig(config);
        result = func();
    } finally {
        if (test && result && typeof result.then === 'function') {
            const oldResult = result;
            result = result.then(cleanup, cleanup).then(() => oldResult);
        } else {
            cleanup();
        }
    }
    return result;
}

function deepClone(obj: Dictionary): Dictionary {
    if (typeof obj === 'object') {
        const propNames = Object.keys(obj);
        const clone: Dictionary = {};
        propNames.forEach(function (name) {
            let prop = obj[name];
            if (typeof prop == 'object' && prop !== null) {
                clone[name] = deepClone(prop);
            } else {
                clone[name] = prop;
            }
        });
        return clone;
    }
    return obj;
}

function deepFrozenClone(obj: Dictionary): Readonly<Dictionary> {
    const propNames = Object.keys(obj);
    const clone: Dictionary = {};
    propNames.forEach(function (name) {
        let prop = obj[name];
        if (typeof prop == 'object' && prop !== null) {
            clone[name] = deepFrozenClone(prop);
        } else {
            clone[name] = prop;
        }
    });
    return Object.freeze(clone);
}

function deepMergeClone(dest: Dictionary, src: Dictionary, path: string[] = []): void {
    const propNames = Object.keys(src);
    propNames.forEach(function (name) {
        let destProp = dest[name];
        let srcProp = src[name];
        if (destProp) {
            const newPath = [...path, name];
            if (typeof destProp == 'object' && typeof srcProp == 'object') {
                deepMergeClone(destProp, srcProp, [...path, name]);
            } else if (typeof destProp === 'object' || (typeof srcProp === 'object' && srcProp !== null)) {
                throw Error(`type mismatch at ${newPath.join('.')}: existing field is ${destProp} and new field is ${srcProp}`);
            } else {
                dest[name] = srcProp;
            }
        } else {
            dest[name] = deepClone(srcProp);
        }
    });
}

// make module a singleton

declare let module: any;
module.exports = ifndef('react-base-global-config-0', module.exports);
