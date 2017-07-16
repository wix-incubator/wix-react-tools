import {AfterHook, BeforeHook, ClassDecorData, EdgeClassData, isClassDecorMixin, MiddlewareHook} from "./index";
import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import _union = require('lodash/union');
import {getGlobalConfig} from "../config";
import {FlagsContext} from "../flags";

export function initChildClass<T extends object>(edgeClassData: EdgeClassData<T>, proto:T) {
    hookedMethodNames(edgeClassData.mixerMeta).forEach((methodName: keyof T) => {
        // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
        if (proto[methodName]) {
            edgeClassData.origin[methodName] = proto[methodName]
        } else if (createIfNotExist(edgeClassData.mixerMeta, methodName)) {
            edgeClassData.origin[methodName] = emptyMethod;
        } else {
            return;
        }
        // TODO named function
        proto[methodName] = function (this: T) {
            let methodArgs: any[] = Array.prototype.slice.call(arguments);
            methodArgs = runBeforeHooks(this, edgeClassData.mixerMeta, methodName, methodArgs);
            let methodResult = runMiddlewareHooksAndOrigin(this, edgeClassData, methodName, methodArgs);
            methodResult = runAfterHooks(this, edgeClassData.mixerMeta, methodName, methodResult);
            return methodResult;
        };
    });
}

function emptyMethod(){}

function createIfNotExist<T extends object>(_this: ClassDecorData<T>, methodName: keyof T): boolean {
    const parent = _this.getParentOf(isClassDecorMixin);
    return (parent && createIfNotExist(parent.$mixerData, methodName)) ||
        _union(
            _this.beforeHooks[methodName],
            _this.middlewareHooks[methodName],
            _this.afterHooks[methodName]
        ).some((hook) => !hook.ifExists);
}

function hookedMethodNames<T extends object>(_this: ClassDecorData<T>): Array<keyof T> {
    const parent = _this.getParentOf(isClassDecorMixin);
    return _union(
        (parent && hookedMethodNames(parent.$mixerData)),
        Object.keys(_this.middlewareHooks),
        Object.keys(_this.beforeHooks),
        Object.keys(_this.afterHooks)) as Array<keyof T>;
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
    const beforeHooks = mixerMeta.beforeHooks[methodName];
    if (beforeHooks) {
        beforeHooks.forEach((hook: BeforeHook<T, typeof methodArgs>) => {
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

function runMiddlewareHooksAndOrigin<T extends object>(target: T, edgeClassData: EdgeClassData<T>, methodName: keyof T, methodArgs: any[]) {
    const originalMethod: (...args: any[]) => any = edgeClassData.origin[methodName]!;
    const middlewareHooks = edgeClassData.mixerMeta.middlewareHooks[methodName];
    let retVal;
    if (middlewareHooks) { // should never be an empty array - either undefined or with hook(s)
        //keep track of last middleware running by ID to determine chain breakage:
        let tracker: MiddlewareTracker = (getGlobalConfig<FlagsContext>().devMode) ? new MiddlewareTracker() : dummyTracker;
        //Run middleware:
        retVal = middlewareHooks[0](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, 1, tracker), methodArgs);
        if (tracker.lastMiddlewareRunning < middlewareHooks.length) {
            console.warn(`@middleware ${middlewareHooks[tracker.lastMiddlewareRunning].name} for ${target.constructor.name}.${methodName}() did not call next`);
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
    const afterHooks = mixerMeta.afterHooks[methodName];
    const devMode = getGlobalConfig<FlagsContext>().devMode;

    if (afterHooks) {
        afterHooks.forEach((hook: AfterHook<T, typeof methodResult>) => {
            const hookMethodResult = hook(target, methodResult);
            if (devMode && methodResult !== undefined && hookMethodResult === undefined) {
                console.warn(`@after ${methodName} Did you forget to return a value?`);
            }
            methodResult = hookMethodResult;
        });
    }

    return methodResult;
}
