import _union = require('lodash/union');
import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import {getGlobalConfig} from './config';
import {FlagsContext} from "./flags";

export type Class<T extends object> = new(...args: any[]) => T;
type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;
export type BeforeHook<T, A extends Array<any>> = (instance: T, methodArguments: A) => A;
export type AfterHook<T, R = void> = (instance: T, methodResult: R) => R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance: T, next: (methodArguments: A) => R, methodArguments: A) => R;
export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;
type Flagged = {
    ifExists?: boolean;
}
function getLazyListProp<O extends object, T>(obj: O, key: keyof O): Array<T> {
    let result = obj[key];
    if (!result) {
        obj[key] = result = [];
    }
    return result;
}

class MixerData<T extends object> {
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

type Mixed<T extends object> = {
    $mixerData: MixerData<T>
    prototype: T;
};
function isMixedClass<T extends object>(clazz: Class<T>): clazz is MixedClass<T> {
    return !!(clazz as MixedClass<T>).$mixerData;
}

type MixedClass<T extends object> = Class<T> & Mixed<T>;

function chain2<T extends object>(f: ClassDecorator<T>, g: ClassDecorator<T>): ClassDecorator<T> {
    return <T1 extends T>(cls: Class<T1>) => g(f(cls));
}
export function chain<T extends object>(...fns: ClassDecorator<T>[]): ClassDecorator<T> {
    return fns.reduce(chain2);
}

// This method assumes originDecorator accepts the hook as first argument
function makeIfExists<T extends Function>(originDecorator: T): T {
    return function ifExists(...args: any[]) {
        const hook = args[0];
        hook.ifExists = true;
        return originDecorator(...args);
    } as Function as  T;
}

export type MethodDecoratorApi<T extends Function> = T & {
    ifExists: T;
}

export function onInstance<T extends object>(hook: ConstructorHook<T>): ClassDecorator<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target: Class<T>): Class<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        mixed.$mixerData.constructorHooks.push(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
}

export const middleware = function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.middlewareHooks, methodName).push(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>;
middleware.ifExists = makeIfExists(middleware);

export const before = function before<T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>): Class<T1> {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.beforeHooks, methodName).push(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: BeforeHook<T, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>;
before.ifExists = makeIfExists(before);

export const after = function after<T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.afterHooks, methodName).unshift(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>;
after.ifExists = makeIfExists(after);

export function add<T extends { [k: string]: Function }>(mixin: T): ClassDecorator<T>;
export function add<T extends { [k: string]: Function }, T1 extends T>(mixin: T, target: Class<T1>): Class<T1>;
export function add<T extends { [k: string]: Function }, T1 extends T>(mixin: T, target?: Class<T1>): Class<T1> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        Object.keys(mixin).forEach((k: keyof T) => {
            if (!mixed.prototype[k]) {
                mixed.prototype[k] = mixin[k];
            }
        });
        return mixed;
    }

    return target ? curried(target) : curried;
}


function isMixed<T>(subj: any): subj is Mixed<T> {
    return subj.isMixed;
}

function mix<T extends object>(clazz: Class<T>): MixedClass<T> {
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
                mixerMeta.origin[methodName] = () => {
                };
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
    throw new Error('before hook did not return an array-like object:' + serialized)
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
