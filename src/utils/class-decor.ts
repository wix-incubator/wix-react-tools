import {
    ConstructorHook, customMixin, Flagged, MixedClass,
    MixerData, mix
} from "./mixer";
import _union = require('lodash/union');
import {getPrivateContext} from "./private-context";
import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import {getGlobalConfig} from "./config";
import {FlagsContext} from "./flags";

export type Class<T extends object> = new(...args: any[]) => T;
export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;

export type BeforeHook<T, A extends Array<any>> = (instance: T, methodArguments: A) => A;
export type AfterHook<T, R = void> = (instance: T, methodResult: R) => R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance: T, next: (methodArguments: A) => R, methodArguments: A) => R;

const NOOP = () => {
};

interface ClassDecorData<T extends object> extends MixerData<T> {
    beforeHooks: {[P in keyof T]?:Array<Flagged & BeforeHook<T, any>>};
    afterHooks: {[P in keyof T]?:Array<Flagged & AfterHook<T, any>>};
    middlewareHooks: {[P in keyof T]?:Array<Flagged & MiddlewareHook<T, any, any>>};
}

interface EdgeClassData<T extends object> {
    edgeClass: Class<T>;
    mixerMeta: ClassDecorData<T>;
    origin: {[P in keyof T]?:T[P] & ((...args: any[]) => any)};
}
type MixedClassDecor<T extends object> = Class<T> & { $mixerData: ClassDecorData<T> };

function isClassDecorMixin<T extends object>(arg: MixedClass<T>): arg is MixedClassDecor<T> {
    return !!(arg as MixedClassDecor<T>).$mixerData.beforeHooks;
}

const privateContextKey = 'class-decor-private-key'; //TODO Symbol or something
function initMixedClassDecor<T extends object, C extends MixedClass<T>>(mixed: C): C & MixedClassDecor<object> {
    const classDecorated = mixed as C & MixedClassDecor<object>;
    classDecorated.$mixerData.beforeHooks = {};
    classDecorated.$mixerData.afterHooks = {};
    classDecorated.$mixerData.middlewareHooks = {};

    // TODO extract generic onFirstInstance
    return onInstance(function onFirstClassDecorInstance(instance: T) {
        let edgeClassData = getPrivateContext<EdgeClassData<T>>(instance.constructor, privateContextKey);
        if (!edgeClassData.origin) {
            edgeClassData.mixerMeta = (instance.constructor as MixedClassDecor<T>).$mixerData;
            edgeClassData.origin = {};
            edgeClassData.edgeClass = instance.constructor as Class<T>;
            initChildClass(edgeClassData)
        }
    })(classDecorated) as typeof classDecorated;
}
const mixClassDecor: <T extends object, C extends Class<T>>(clazz: C) => C & MixedClassDecor<T>
    = customMixin.bind(null, initMixedClassDecor, isClassDecorMixin);

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

function getLazyListProp<O extends object, T>(obj: O, key: keyof O): Array<T> {
    let result = obj[key];
    if (!result) {
        obj[key] = result = [];
    }
    return result;
}

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


export const middleware = function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mixClassDecor<T1, Class<T1>>(t);
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
        const mixed = mixClassDecor<T1, Class<T1>>(t);
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
        const mixed = mixClassDecor<T1, Class<T1>>(t);
        getLazyListProp(mixed.$mixerData.afterHooks, methodName).unshift(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>;
after.ifExists = makeIfExists(after);

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

function initChildClass<T extends object>(edgeClassData: EdgeClassData<T>) {
    const proto = edgeClassData.edgeClass.prototype;
    hookedMethodNames(edgeClassData.mixerMeta).forEach((methodName: keyof T) => {
        // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
        if (proto[methodName]) {
            edgeClassData.origin[methodName] = proto[methodName]
        } else if (createIfNotExist(edgeClassData.mixerMeta, methodName)) {
            edgeClassData.origin[methodName] = NOOP;
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

function errorBeforeNtReturnedArray(methodArgs: any[]) {
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
