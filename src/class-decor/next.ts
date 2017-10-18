import {InheritedWrapApi, Wrapper} from "../wrappers/index";
import {ConstructorHook} from "./mixer";
import {Class} from "../core/types";
import {mergeOptionalArrays} from "../functoin-decor/common";
import {privateState} from "../index";

export type ClassInitHook<T extends object> = (clazz: Class<T>) => void;

export type MethodWrapper = Wrapper<Function>;

export type MethodWrappers = Array<MethodWrapper> & {
    force?: true;
}
export type MethodsMetaData = {
    [methodName: string]: MethodWrappers
};

export type ClassMetaData = {
    constructorHooks: Array<ConstructorHook<any>> | null;
    classInitHooks: Array<ClassInitHook<any>> | null;
    methodWrappers: MethodsMetaData | null
//    subClassInitHooks: Array<ClassInitHook<any>> | null;
}

function mergeMethodsWrappers(md1: MethodsMetaData | null, md2: MethodsMetaData | null): MethodsMetaData | null {
    if (md1) {
        if (md2) {
            // merge both objects
            const merged: MethodsMetaData = Object.create(md1);
            for (const methodName in md2) {
                const md2Wrappers = md2[methodName];
                if (Array.isArray(md2Wrappers) && md2Wrappers.length) {
                    const md1Wrappers = md1[methodName];
                    if (Array.isArray(md1Wrappers) && md1Wrappers.length) {
                        merged[methodName] = md1Wrappers.concat(md2Wrappers);
                        merged[methodName].force = md1Wrappers.force || md2Wrappers.force;
                    } else {
                        merged[methodName] = md2Wrappers;
                    }
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

export function classDecorMetadataMerge(md1: ClassMetaData, md2: ClassMetaData): ClassMetaData {
    return {
        constructorHooks: mergeOptionalArrays(md1.constructorHooks, md2.constructorHooks),
        classInitHooks: mergeOptionalArrays(md1.classInitHooks, md2.classInitHooks),
        methodWrappers: mergeMethodsWrappers(md1.methodWrappers, md2.methodWrappers),
//        subClassInitHooks: mergeOptionalArrays(md1.subClassInitHooks, md2.subClassInitHooks),
    };
}

function call(f: MethodWrapper, g: Function): Function {
    return f(g);
}

function emptyMethod() {
}

type DumbClass = new(...args: any[]) => object;

function initializeClass(wrapperArgs: Partial<ClassMetaData>, clazz: Class<any>) {
// decorate class methods
    const methodWrappers = wrapperArgs.methodWrappers;
    if (methodWrappers) {
        for (const methodName in methodWrappers) {
            const wrappers = methodWrappers[methodName];
            if (clazz.prototype[methodName]) {
                clazz.prototype[methodName] = wrappers.reduce(call, clazz.prototype[methodName]);
            } else if (wrappers.force) {
                clazz.prototype[methodName] = wrappers.reduce(call, emptyMethod);
            }
        }
    }
    // run class init hooks
    const classInitHooks = wrapperArgs.classInitHooks;
    if (classInitHooks) {
        for (let i = 0; i < classInitHooks.length; i++) {
            classInitHooks[i](clazz);
        }
    }
}

// run initializeClass once per class
const initClass = privateState<true, Class<any>>('class-decor-init', (clazz: Class<any>) => {
    const wrapperArgs = classDecor.getWrapperArgs(clazz);
    if (wrapperArgs) {
        initializeClass(wrapperArgs, clazz);
    } else {
        throw new Error(`unexpected : class ${clazz.name} is not wrapped`);
    }
    return true;
});

export function classDecorWrapper<T extends Class<object>>(target: T, args: Partial<ClassMetaData>): T {
    if (classDecor.isWrapped(target)) {
        return target;
    }

    class Extended extends (target as any as DumbClass) {
        constructor(...args: any[]) {
            super(...args);
            initClass(Extended);
            // TODO run class init and constructor hooks (?)
        }
    }

    return Extended as any;
}

export const classDecor = new InheritedWrapApi<Partial<ClassMetaData>, Class<object>>('class-decor', classDecorWrapper, classDecorMetadataMerge);
