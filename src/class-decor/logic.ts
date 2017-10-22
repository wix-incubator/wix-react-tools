import {Class, TypedPropertyDescriptorMap} from "../core/types";
import {privateState} from "../core/private-state";
import {functionDecor} from "../functoin-decor/index";
import {Feature} from "../wrappers/index";
import {ClassDecor} from "./index";

export type MethodWrapper = Feature<Function>;

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

export function mergeMethodsMetadata(md1: MethodsMetaData | null, md2: MethodsMetaData | null): MethodsMetaData | null {
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


function call(f: Function, g: MethodWrapper): Function {
    return g(f);
}

function emptyMethod() {
}

type DumbClass = new(...args: any[]) => object;

/**
 * initialize decorated class (wrapped methods and added properties)
 * @param {Partial<ClassMetaData>} wrapperArgs class-decor metadata
 * @param {Class<any>} clazz class to initialize
 */
function initializeExtended(wrapperArgs: Partial<ClassMetaData>, clazz: Class<any>) {
    initializeConstructor(wrapperArgs, clazz);
    const properties = wrapperArgs.properties;
    if (properties) {
        // define properties
        Object.defineProperties(clazz.prototype, properties);
    }
}

/**
 * initialize wrapped methods of constructor that inherits (or is itself) a decorated class
 * @param {Partial<ClassMetaData>} wrapperArgs
 * @param {Class<any>} clazz
 */
function initializeConstructor(wrapperArgs: Partial<ClassMetaData>, clazz: Class<any>) {
    initCtor(clazz);
    const methodsMetadata = wrapperArgs.methodsMetadata;
    if (methodsMetadata) {
        // decorate class methods
        for (const methodName in methodsMetadata) {
            const wrappers = methodsMetadata[methodName];
            let method: Function | null = null;
            if (clazz.prototype[methodName]) {
                method = functionDecor.normalize(clazz.prototype[methodName]);
            } else if (wrappers.force) {
                method = emptyMethod;
            }

            if (method) {
                clazz.prototype[methodName] = wrappers.reduce(call, method);
            }
        }
    }
}

const initCtor = privateState<true, Class<any>>('class-decor-initialized', () => true);


export function extendClass<T extends Class<object>>(classDecor: ClassDecor, target: T): T {
    return class Extended extends (target as any as DumbClass) {
        constructor(...args: any[]) {
            super(...args);
            const wrapperArgs = classDecor.getDecoration(Extended);
            if (wrapperArgs) {
                if (!initCtor.hasState(Extended)) {
                    initializeExtended(wrapperArgs, Extended);
                }
                const ctor = this.constructor as Class<any>;
                // `classDecor.getOriginal(ctor) === target` asserts that ctor is initialized after initializeExtended() of all of its wrapped ancestors
                if (!initCtor.hasState(ctor) && classDecor.getOriginal(ctor) === target) {
                    initializeConstructor(wrapperArgs, ctor);
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
    } as any;
}


