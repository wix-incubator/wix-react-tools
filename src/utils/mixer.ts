import {getGlobalConfig} from './config';
import {FlagsContext} from "./flags";
import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import _union = require('lodash/union');

const NOOP = ()=>{};

export type Class<T extends object> = new(...args: any[]) => T;
type DumbClass = new(...args: any[]) => object;
export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;
export type BeforeHook<T, A extends Array<any>> = (instance: T, methodArguments: A) => A;
export type AfterHook<T, R = void> = (instance: T, methodResult: R) => R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance: T, next: (methodArguments: A) => R, methodArguments: A) => R;

export function mix<T extends object>(clazz: Class<T>): MixedClass<T> {
    // de-dup class creation
    if (isMixed<T>(clazz)) {
        // https://github.com/wix/react-bases/issues/10
        return clazz;
    }
    class Extended extends (clazz as any as DumbClass) {
        static isMixed: boolean = true;
        static readonly $mixerData: MixerData<T>;

        constructor(...args: any[]) {
            super(...args);
            // if not inherited by another class, remove itself so to not pollute instance's name
            activateMixins(this as any as T, Extended.$mixerData, args);
        }
    }
    Object.defineProperty(Extended, '$mixerData', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new MixerData<T>(clazz)
    });
    // TODO remove this ineffective dirty fix, see https://github.com/wix/react-bases/issues/50
    Object.defineProperty(Extended, 'name', {
        enumerable: false,
        writable: false,
        value: clazz.name
    });
    return Extended as any;
}

export type MixedClass<T extends object> = Class<T> & Mixed<T>;

export type Flagged = {
    ifExists?: boolean;
}

export class MixerData<T extends object> {
    readonly superData: MixerData<Partial<T>>;
    activated?: boolean;
    constructorHooks: Flagged & ConstructorHook<T>[] = [];
    beforeHooks: {[P in keyof T]?:Array<Flagged & BeforeHook<T, any>>} = {};
    afterHooks: {[P in keyof T]?:Array<Flagged & AfterHook<T, any>>} = {};
    middlewareHooks: {[P in keyof T]?:Array<Flagged & MiddlewareHook<T, any, any>>} = {};
    origin: {[P in keyof T]?:T[P] & ((...args: any[]) => any)} = {};

    constructor(public originalClass: Class<T>) {
        if (isMixedClass(originalClass)) {
            this.superData = originalClass.$mixerData;
        }
    }

    createIfNotExist(methodName: keyof T): boolean {
        return (this.superData && this.superData.createIfNotExist(methodName)) ||
            _union(
                this.beforeHooks[methodName],
                this.middlewareHooks[methodName],
                this.afterHooks[methodName]
            ).some((hook) => !hook.ifExists);
    }

    get hookedMethodNames(): Array<keyof T> {
        return _union(
            (this.superData && this.superData.hookedMethodNames),
            Object.keys(this.middlewareHooks),
            Object.keys(this.beforeHooks),
            Object.keys(this.afterHooks)) as Array<keyof T>;
    }
}

export type Mixed<T extends object> = {
    $mixerData: MixerData<T>
    prototype: T;
};

function isMixedClass<T extends object>(clazz: Class<T>): clazz is MixedClass<T> {
    return !!(clazz as MixedClass<T>).$mixerData;
}

function isMixed<T>(subj: any): subj is Mixed<T> {
    return subj.isMixed;
}
function activateMixins<T extends object>(target: T, mixerMeta: MixerData<T>, ctorArgs: any[]) {
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach(
        (cb: ConstructorHook<T>) => cb(target, ctorArgs));

    if (!mixerMeta.activated) {
        mixerMeta.activated = true;

        mixerMeta.hookedMethodNames.forEach((methodName: keyof T) => {
            // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
            if (target[methodName]) {
                mixerMeta.origin[methodName] = target[methodName]
            } else if (mixerMeta.createIfNotExist(methodName)) {
                mixerMeta.origin[methodName] = NOOP;
            } else {
                return;
            }
            // TODO named function
            Object.getPrototypeOf(target)[methodName] = function (this: T) {
                let methodArgs: any[] = Array.prototype.slice.call(arguments);
                methodArgs = runBeforeHooks(this, mixerMeta, methodName, methodArgs);
                let methodResult = runMiddlewareHooksAndOrigin(this, mixerMeta, methodName, methodArgs);
                methodResult = runAfterHooks(this, mixerMeta, methodName, methodResult);
                return methodResult;
            };
        });
    }
}

function errorBeforeNtReturnedArray(methodArgs: any[]) {
    let serialized = '(unSerializable)';
    try {
        serialized = JSON.stringify(methodArgs)
    } catch (e) {
    }
    throw new Error('before hook did not return an array-like object: ' + serialized)
}

function runBeforeHooks<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodArgs: any[]) {
    const beforeHooks = mixerMeta.beforeHooks[methodName];
    if (beforeHooks) {
        beforeHooks.forEach((hook: BeforeHook<T, typeof methodArgs>) => {
            methodArgs = hook(target, methodArgs);
            if (!_isArrayLikeObject(methodArgs)) {
                errorBeforeNtReturnedArray(methodArgs);
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

function runMiddlewareHooksAndOrigin<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodArgs: any[]) {
    const originalMethod: (...args: any[]) => any = mixerMeta.origin[methodName]!;
    const middlewareHooks = mixerMeta.middlewareHooks[methodName];
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

function runAfterHooks<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodResult: any) {
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
