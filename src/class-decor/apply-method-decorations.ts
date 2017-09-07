import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import _union = require('lodash/union');
import {getGlobalConfig} from "../core/config";
import {Class, GlobalConfig} from "../core/types";
import {
    AfterMethodHook,
    BeforeMethodHook,
    inheritedMixerData,
    MethodData,
    MiddlewareMethodHook,
    MixerData
} from "./mixer";
import {classPrivateState} from "../core/class-private-state";

const edgeClassData = classPrivateState('edge class data', clazz => new EdgeClassData(clazz));

export const initEdgeClass = (clazz: Class<object>) => {
    if (!edgeClassData.hasState(clazz)) {
        edgeClassData(clazz).init();
    }
};
function notIfExists(hook: Function & { ifExists?: boolean }) {
    return !hook.ifExists;
}
function shouldCreateMethod(methodData: MethodData): boolean {
    return Boolean((methodData.before && methodData.before.some(notIfExists)) ||
        (methodData.after && methodData.after.some(notIfExists)) ||
        (methodData.middleware && methodData.middleware.some(notIfExists)));
}
export class EdgeClassData<T extends object = object> {

    // TODO move to function decor (use private state?)
    private static unwrapMethod(method: Function | WrappedMethod): Function | undefined {
        if ((method as WrappedMethod)[wrappedFlag]) {
            return (method as WrappedMethod).originalMethod;
        }
        return method;
    }

    constructor(private clazz: Class<T>) {
    }

    get mixerData(): MixerData<Partial<T>> {
        return inheritedMixerData.unsafe(this.clazz);
    }

    init() {
        this.mixerData.hookedMethodNames()
            .forEach((methodName: keyof T) => {
                let methodData = this.mixerData.getMethodData(methodName);
                if (methodData) {
                    // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
                    if (this.clazz.prototype[methodName]) {
                        this.clazz.prototype[methodName] = this.wrapMethod(methodName, methodData, EdgeClassData.unwrapMethod(this.clazz.prototype[methodName]));
                    } else if (shouldCreateMethod(methodData)) {
                        this.clazz.prototype[methodName] = this.wrapMethod(methodName, methodData);
                    }
                }
            });
    }

    private wrapMethod<P extends keyof T>(methodName: P, methodData: MethodData, originalMethod?: T[P]): WrappedMethod {
        // TODO dynamically named function
        const result = function wrappedClassDecorMethod(this: T) {
            let methodArgs: any[] = Array.prototype.slice.call(arguments);
            methodArgs = runBeforeHooks(this, methodData.before, methodName, methodArgs);
            let methodResult = runMiddlewareHooksAndOrigin(this, methodData.middleware, originalMethod || emptyMethod, methodName, methodArgs);
            methodResult = runAfterHooks(this, methodData.after, methodName, methodResult);
            return methodResult;
        } as any as WrappedMethod;
        result[wrappedFlag] = true;
        if (originalMethod) {
            result.originalMethod = originalMethod;
        }
        return result;
    }
}

const wrappedFlag = '$class-decor-wrapped-method'; //TODO Symbol or something

function emptyMethod() {
}

type WrappedMethod<F extends Function = Function> = F & {
    ['$class-decor-wrapped-method']: true;
    originalMethod?: F;
}

function errorBeforeDidNotReturnedArray(methodArgs: any[]) {
    let serialized = '(unSerializable)';
    try {
        serialized = JSON.stringify(methodArgs)
    } catch (e) {
    }
    throw new Error('before hook did not return an array-like object: ' + serialized)
}

function runBeforeHooks<T extends object>(target: T, hooks: Array<BeforeMethodHook> | null, methodName: keyof T, methodArgs: any[]) {
    if (hooks) {
        hooks.forEach((hook: BeforeMethodHook<any, T>) => {
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

function runMiddlewareHooksAndOrigin<T extends object>(target: T, hooks: Array<MiddlewareMethodHook> | null, originalMethod: (...args: any[]) => any, methodName: keyof T, methodArgs: any[]) {
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

function createNextForMiddlewareHook<T extends object, A, R>(target: T, originalMethod: (...args: any[]) => R, middlewareHooks: Array<MiddlewareMethodHook<A, R, T>>, idx: number, tracker: MiddlewareTracker) {
    return (args: any[]): R => {
        tracker.reportNextMiddleware(idx);
        return middlewareHooks.length <= idx ?
            (originalMethod && originalMethod.apply(target, args)) :
            middlewareHooks[idx](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, idx + 1, tracker), args as any);
    };
}

function runAfterHooks<T extends object>(target: T, hooks: Array<AfterMethodHook> | null, methodName: keyof T, methodResult: any) {
    const devMode = getGlobalConfig<GlobalConfig>().devMode;

    if (hooks) {
        hooks.forEach((hook: AfterMethodHook) => {
            const hookMethodResult = hook(target, methodResult);
            if (devMode && methodResult !== undefined && hookMethodResult === undefined) {
                console.warn(`@after ${methodName} Did you forget to return a value?`);
            }
            methodResult = hookMethodResult;
        });
    }

    return methodResult;
}
