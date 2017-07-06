import {ifndef} from 'ifndef'

export interface Dictionary {
    [index: string]: any;
}
let internalState: Dictionary = {};

let dirty = true;

let publicState: Readonly<Dictionary> = {};


export function overrideGlobalConfig(config: Dictionary): void {
    internalState = deepClone(config);
    dirty = true;
}

export function setGlobalConfig(config: Dictionary): void {
    deepMergeClone(internalState, config);
    dirty = true;
}

export function getGlobalConfig<T extends object = Dictionary>(): T {
    if (dirty) {
        publicState = deepFrozenClone(internalState);
    }
    return publicState as T;
}

export function runInContext(config: Dictionary, func: Function, test = false) {
    const cleanup = overrideGlobalConfig.bind(null, deepClone(internalState));
    let result: any = null;
    dirty = true;
    try {
        setGlobalConfig(config);
        return result = func();
    } finally {
        if (test && result && typeof result.then === 'function') {
            return result.then(cleanup, cleanup).then(() => result);
        } else {
            cleanup();
        }
    }
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
module.exports = ifndef('rect-base-global-config-0', module.exports);
