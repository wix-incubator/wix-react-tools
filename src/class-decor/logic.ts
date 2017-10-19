import {Wrapper} from "../wrappers/index";
import {Class, TypedPropertyDescriptorMap} from "../core/types";
import {mergeOptionalArrays} from "../functoin-decor/common";
import {ClassDecor} from "./index";

export type MethodWrapper = Wrapper<Function>;

export type ConstructorHook<T extends object> = (this: T, constructorArguments: any[]) => void;

export function forceMethod(...wrappers: MethodWrapper[]): MethodWrappers {
    const result: MethodWrappers = wrappers;
    result.force = true;
    return result;
}

export type MethodWrappers = Array<MethodWrapper> & {
    force?: true;
}
export type MethodsMetaData = {
    [methodName: string]: MethodWrappers
};

export type ClassMetaData = {
    constructorHooks: Array<ConstructorHook<any>> | null;
    methodsMetadata: MethodsMetaData | null;
    properties: TypedPropertyDescriptorMap<any> | null;
}

function mergeMethodsMetadata(md1: MethodsMetaData | null, md2: MethodsMetaData | null): MethodsMetaData | null {
    if (md1) {
        if (md2) {
            // merge both objects
            const merged: MethodsMetaData = Object.assign({}, md1, md2);
            for (const methodName in md2) {
                if (md2.hasOwnProperty(methodName) && md1.hasOwnProperty(methodName)) {
                    merged[methodName] = md1[methodName].concat(md2[methodName]);
                    merged[methodName].force = md1[methodName].force || md2[methodName].force;
                }
            }
            return merged;
        } else {
            return md1;
        }
    } else {
        return md2;
    }
}

export function makeClassDecorMetadata(constructorHooks: Array<ConstructorHook<any>> | null,
                                       methodsMetadata: MethodsMetaData | null,
                                       properties: TypedPropertyDescriptorMap<any> | null): ClassMetaData {
    return {constructorHooks, methodsMetadata, properties}
}

export function mergeClassDecorMetadata(md1: ClassMetaData, md2: ClassMetaData): ClassMetaData {
    return {
        constructorHooks: mergeOptionalArrays(md1.constructorHooks, md2.constructorHooks),
        methodsMetadata: mergeMethodsMetadata(md1.methodsMetadata, md2.methodsMetadata),
        properties: Object.assign({}, md2.properties, md1.properties),
    };
}

function call(f: Function, g: MethodWrapper): Function {
    return g(f);
}

function emptyMethod() {
}

type DumbClass = new(...args: any[]) => object;

function initializeClass(wrapperArgs: Partial<ClassMetaData>, clazz: Class<any>) {
    const methodsMetadata = wrapperArgs.methodsMetadata;
    if (methodsMetadata) {
        // decorate class methods
        for (const methodName in methodsMetadata) {
            const wrappers = methodsMetadata[methodName];
            if (clazz.prototype[methodName]) {
                clazz.prototype[methodName] = wrappers.reduce(call, clazz.prototype[methodName]);
            } else if (wrappers.force) {
                clazz.prototype[methodName] = wrappers.reduce(call, emptyMethod);
            }
        }
    }
    const properties = wrapperArgs.properties;
    if (properties) {
        // define properties
        Object.defineProperties(clazz.prototype, properties);
    }
}

export function classDecorWrapper<T extends Class<object>>(this : ClassDecor, target: T): T {
    if (this.isThisWrapped(target)) {
        return target;
    }
    const classDecor = this;
    let initialized = false; // TODO measure if having a flag in parent scope is faster than private-state of `true`

    class Extended extends (target as any as DumbClass) {
        constructor(...args: any[]) {
            super(...args);
            const wrapperArgs = classDecor.getWrapperArgs(Extended);
            if (wrapperArgs) {
                if (!initialized) {
                    initialized = true;
                    initializeClass(wrapperArgs, Extended);
                }
                const constructorHooks = wrapperArgs.constructorHooks;
                if (constructorHooks) {
                    // run constructor hooks
                    for (let i = 0; i < constructorHooks.length; i++) {
                        constructorHooks[i].call(this, args);
                    }
                }
            } else {
                throw new Error(`unexpected : class ${target.name} is not properly wrapped`);
            }
        }
    }

    return Extended as any;
}

