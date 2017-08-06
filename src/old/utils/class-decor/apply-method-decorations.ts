import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import _union = require('lodash/union');
import {getGlobalConfig} from "../../../core/config";
import {Class, GlobalConfig} from "../../../core/types";
import {unsafeMixerData, MixerData} from "./mixer";

export type BeforeHook<T, A extends Array<any>> = (instance: T, methodArguments: A) => A;
export type AfterHook<T, R = void> = (instance: T, methodResult: R) => R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance: T, next: (methodArguments: A) => R, methodArguments: A) => R;

export type FlaggedArray<T> = Array<{
    ifExists?: boolean;
} & T>

export interface ClassDecorData<T extends object> extends MixerData<T> {
    beforeHooks: {[P in keyof T]?:FlaggedArray<BeforeHook<T, any>>};
    afterHooks: {[P in keyof T]?:FlaggedArray<AfterHook<T, any>>};
    middlewareHooks: {[P in keyof T]?:FlaggedArray<MiddlewareHook<T, any, any>>};
}

export class EdgeClassData<T extends object = object> {

    // TODO move to function decor (use private state?)
    private static unwrapMethod(method: Function | WrappedMethod): Function | undefined {
        if ((method as WrappedMethod)[wrappedFlag]) {
            return (method as WrappedMethod).originalMethod;
        }
        return method;
    }

    origin: {[P in keyof T]?:T[P] & ((...args: any[]) => any)} = {};

    constructor(private clazz: Class<T>) {
    }

    init() {
        this.hookedMethodNames(getClassDecorData(this.clazz)).forEach((methodName: keyof T) => {
            // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
            if (this.clazz.prototype[methodName]) {
                this.clazz.prototype[methodName] = this.wrapMethod(methodName, EdgeClassData.unwrapMethod(this.clazz.prototype[methodName]));
            } else if (createIfNotExist(getClassDecorData(this.clazz), methodName)) {
                this.clazz.prototype[methodName] = this.wrapMethod(methodName);
            }
        });
    }

    private hookedMethodNames(classData: ClassDecorData<T>): Array<keyof T> {
        const parent = classData.getParentOf(isClassDecorMixin);
        return _union(
            (parent && this.hookedMethodNames(getClassDecorData(parent))),
            Object.keys(classData.middlewareHooks),
            Object.keys(classData.beforeHooks),
            Object.keys(classData.afterHooks)) as Array<keyof T>;
    }

    private wrapMethod<P extends keyof T>(methodName: P, originalMethod?: T[P]): WrappedMethod {
        const mixerMeta = getClassDecorData(this.clazz);
        // TODO dynamically named function
        const result = function wrappedClassDecorMethod(this: T) {
            let methodArgs: any[] = Array.prototype.slice.call(arguments);
            methodArgs = runBeforeHooks(this, mixerMeta, methodName, methodArgs);
            let methodResult = runMiddlewareHooksAndOrigin(this, mixerMeta, originalMethod || emptyMethod, methodName, methodArgs);
            methodResult = runAfterHooks(this, mixerMeta, methodName, methodResult);
            return methodResult;
        } as any as WrappedMethod;
        result[wrappedFlag] = true;
        if (originalMethod) {
            result.originalMethod = originalMethod;
        }
        return result;
    }
}


export function isClassDecorMixin<T extends object>(arg: Class<T>): arg is Class<T> {
    return !!getClassDecorData(arg).beforeHooks;
}

export function getClassDecorData<T extends object>(clazz: Class<T>): ClassDecorData<T> {
    return unsafeMixerData.inherited(clazz) as ClassDecorData<T>;
}

const wrappedFlag = '$class-decor-wrapped-method'; //TODO Symbol or something

function emptyMethod() {
}

type WrappedMethod<F extends Function = Function> = F & {
    ['$class-decor-wrapped-method']: true;
    originalMethod?: F;
}


function createIfNotExist<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): boolean {
    const parent = classData.getParentOf(isClassDecorMixin);
    return (parent && createIfNotExist(getClassDecorData(parent), methodName)) ||
        _union(
            classData.beforeHooks[methodName],
            classData.middlewareHooks[methodName],
            classData.afterHooks[methodName]
        ).some((hook) => !hook.ifExists);
}


function middlewareHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<MiddlewareHook<T, any, any>> | undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && middlewareHooks(getClassDecorData(parent), methodName);
    const thisHooks = classData.middlewareHooks[methodName];
    if (parentHooks) {
        return thisHooks ? _union(parentHooks, thisHooks) : parentHooks;
    }
    return thisHooks;
}

function beforeHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<BeforeHook<T, any>> | undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && beforeHooks(getClassDecorData(parent), methodName);
    const thisHooks = classData.beforeHooks[methodName];
    if (parentHooks) {
        // notice: after order is reversed to before order
        return thisHooks ? _union(parentHooks, thisHooks) : parentHooks;
    }
    return thisHooks;
}
function afterHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<AfterHook<T, any>> | undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && afterHooks(getClassDecorData(parent), methodName);
    const thisHooks = classData.afterHooks[methodName];
    if (parentHooks) {
        // notice: after order is reversed to before order
        return thisHooks ? _union(thisHooks, parentHooks) : parentHooks;
    }
    return thisHooks;
}

function errorBeforeDidNotReturnedArray(methodArgs: any[]) {
    let serialized = '(unSerializable)';
    try {
        serialized = JSON.stringify(methodArgs)
    } catch (e) {
    }
    throw new Error('before hook did not return an array-like object: ' + serialized)
}

function runBeforeHooks<T extends object>(target: T, mixerMeta: ClassDecorData<T>, methodName: keyof T, methodArgs: any[]) {
    const hooks = beforeHooks(mixerMeta, methodName);
    if (hooks) {
        hooks.forEach((hook: BeforeHook<T, typeof methodArgs>) => {
            methodArgs = hook(target, methodArgs);
            if (!_isArrayLikeObject(methodArgs)) {
                errorBeforeDidNotReturnedArray(methodArgs);
            }
        });
    }
    return methodArgs;
}
class MiddlewareTracker {
    lastMiddlewareRunning = 0;

    reportNextMiddleware(index: number) {
        this.lastMiddlewareRunning = Math.max(index, this.lastMiddlewareRunning);
    };
}

// to simplify code, use this instead of an active tracker
const dummyTracker = {
    lastMiddlewareRunning: Number.MAX_VALUE,
    reportNextMiddleware(index: number){
    }
};

function runMiddlewareHooksAndOrigin<T extends object>(target: T, mixerMeta: ClassDecorData<T>, originalMethod: (...args: any[]) => any, methodName: keyof T, methodArgs: any[]) {
    const hooks = middlewareHooks(mixerMeta, methodName);
    let retVal;
    if (hooks) { // should never be an empty array - either undefined or with hook(s)
        //keep track of last middleware running by ID to determine chain breakage:
        let tracker: MiddlewareTracker = (getGlobalConfig<GlobalConfig>().devMode) ? new MiddlewareTracker() : dummyTracker;
        //Run middleware:
        retVal = hooks[0](target, createNextForMiddlewareHook(target, originalMethod, hooks, 1, tracker), methodArgs);
        if (tracker.lastMiddlewareRunning < hooks.length) {
            console.warn(`@middleware ${hooks[tracker.lastMiddlewareRunning].name} for ${target.constructor.name}.${methodName}() did not call next`);
        }
    } else {
        // No middleware - only original function
        retVal = (originalMethod && originalMethod.apply(target, methodArgs));
    }
    return retVal;
}

function createNextForMiddlewareHook<T extends object, A extends Array<any>, R>(target: T, originalMethod: (...args: any[]) => R, middlewareHooks: Array<MiddlewareHook<T, A, R>>, idx: number, tracker: MiddlewareTracker) {
    return (...args: any[]): R => {
        tracker.reportNextMiddleware(idx);
        return middlewareHooks.length <= idx ?
            (originalMethod && originalMethod.apply(target, args)) :
            middlewareHooks[idx](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, idx + 1, tracker), args as A);
    };
}

function runAfterHooks<T extends object>(target: T, mixerMeta: ClassDecorData<T>, methodName: keyof T, methodResult: any) {
    const hooks = afterHooks(mixerMeta, methodName);
    const devMode = getGlobalConfig<GlobalConfig>().devMode;

    if (hooks) {
        hooks.forEach((hook: AfterHook<T, typeof methodResult>) => {
            const hookMethodResult = hook(target, methodResult);
            if (devMode && methodResult !== undefined && hookMethodResult === undefined) {
                console.warn(`@after ${methodName} Did you forget to return a value?`);
            }
            methodResult = hookMethodResult;
        });
    }

    return methodResult;
}
