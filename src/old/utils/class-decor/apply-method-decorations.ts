import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import _union = require('lodash/union');
import {getGlobalConfig} from "../config";
import {FlagsContext} from "../flags";
import {Class, MixedClass, MixerData} from "./mixer";

export type BeforeHook<T, A extends Array<any>> = (instance: T, methodArguments: A) => A;
export type AfterHook<T, R = void> = (instance: T, methodResult: R) => R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance: T, next: (methodArguments: A) => R, methodArguments: A) => R;

export type FlaggedArray<T> = Array <{
    ifExists?: boolean;
} & T>

export interface ClassDecorData<T extends object> extends MixerData<T> {
    beforeHooks: {[P in keyof T]?:FlaggedArray<BeforeHook<T, any>>};
    afterHooks: {[P in keyof T]?:FlaggedArray<AfterHook<T, any>>};
    middlewareHooks: {[P in keyof T]?:FlaggedArray<MiddlewareHook<T, any, any>>};
}

export interface EdgeClassData<T extends object> {
    mixerMeta: ClassDecorData<T>;
    origin: {[P in keyof T]?:T[P] & ((...args: any[]) => any)};
}
export type MixedClassDecor<T extends object> = Class<T> & { $mixerData: ClassDecorData<T> };

export function isClassDecorMixin<T extends object>(arg: MixedClass<T>): arg is MixedClassDecor<T> {
    return !!(arg as MixedClassDecor<T>).$mixerData.beforeHooks;
}
const wrappedFlag = '$class-decor-wrapped-method'; //TODO Symbol or something

function emptyMethod(){}

type WrappedMethod<F extends Function = Function> = F & {
    ['$class-decor-wrapped-method']:true;
    originalMethod?:F;
}

function wrapMethod<T extends object, P extends keyof T>(edgeClassData: EdgeClassData<T>, methodName: P, originalMethod?: T[P]):WrappedMethod{
    // TODO dynamically named function
    const result = function wrappedClassDecorMethod(this: T) {
        let methodArgs: any[] = Array.prototype.slice.call(arguments);
        methodArgs = runBeforeHooks(this, edgeClassData.mixerMeta, methodName, methodArgs);
        let methodResult = runMiddlewareHooksAndOrigin(this, edgeClassData.mixerMeta, originalMethod || emptyMethod, methodName, methodArgs);
        methodResult = runAfterHooks(this, edgeClassData.mixerMeta, methodName, methodResult);
        return methodResult;
    } as any as WrappedMethod;
    result[wrappedFlag] = true;
    if (originalMethod) {
        result.originalMethod = originalMethod;
    }
    return result;
}

function unwrapMethod(method:Function | WrappedMethod): Function| undefined{
    if ((method as WrappedMethod)[wrappedFlag]){
        return (method as WrappedMethod).originalMethod;
    }
    return method;
}

export function initChildClass<T extends object>(edgeClassData: EdgeClassData<T>, proto:T) {
    hookedMethodNames(edgeClassData.mixerMeta).forEach((methodName: keyof T) => {
        // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
        if (proto[methodName]) {
            proto[methodName] = wrapMethod(edgeClassData, methodName, unwrapMethod(proto[methodName]));
        } else if (createIfNotExist(edgeClassData.mixerMeta, methodName)) {
            proto[methodName] = wrapMethod(edgeClassData, methodName);
        }
    });
}

function createIfNotExist<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): boolean {
    const parent = classData.getParentOf(isClassDecorMixin);
    return (parent && createIfNotExist(parent.$mixerData, methodName)) ||
        _union(
            classData.beforeHooks[methodName],
            classData.middlewareHooks[methodName],
            classData.afterHooks[methodName]
        ).some((hook) => !hook.ifExists);
}

function hookedMethodNames<T extends object>(classData: ClassDecorData<T>): Array<keyof T> {
    const parent = classData.getParentOf(isClassDecorMixin);
    return _union(
        (parent && hookedMethodNames(parent.$mixerData)),
        Object.keys(classData.middlewareHooks),
        Object.keys(classData.beforeHooks),
        Object.keys(classData.afterHooks)) as Array<keyof T>;
}

function middlewareHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<MiddlewareHook<T, any, any>>| undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && middlewareHooks(parent.$mixerData, methodName);
    const thisHooks = classData.middlewareHooks[methodName];
    if (parentHooks){
        return thisHooks ? _union(parentHooks,thisHooks) : parentHooks;
    }
    return thisHooks;
}

function beforeHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<BeforeHook<T, any>>| undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && beforeHooks(parent.$mixerData, methodName);
    const thisHooks = classData.beforeHooks[methodName];
    if (parentHooks){
        // notice: after order is reversed to before order
        return thisHooks ? _union(parentHooks,thisHooks) : parentHooks;
    }
    return thisHooks;
}
function afterHooks<T extends object>(classData: ClassDecorData<T>, methodName: keyof T): FlaggedArray<AfterHook<T, any>>| undefined {
    const parent = classData.getParentOf(isClassDecorMixin);
    const parentHooks = parent && afterHooks(parent.$mixerData, methodName);
    const thisHooks = classData.afterHooks[methodName];
    if (parentHooks){
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

function runMiddlewareHooksAndOrigin<T extends object>(target: T, mixerMeta: ClassDecorData<T>, originalMethod:(...args:any[])=>any, methodName: keyof T, methodArgs: any[]) {
    const hooks = middlewareHooks(mixerMeta, methodName);
    let retVal;
    if (hooks) { // should never be an empty array - either undefined or with hook(s)
        //keep track of last middleware running by ID to determine chain breakage:
        let tracker: MiddlewareTracker = (getGlobalConfig<FlagsContext>().devMode) ? new MiddlewareTracker() : dummyTracker;
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
    const devMode = getGlobalConfig<FlagsContext>().devMode;

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
