import _union = require('lodash/union');
import _isArrayLikeObject = require('lodash/isArrayLikeObject');
import { getGlobalConfig } from '../utils/config';
import {Flags} from "./flags";

export type Class<T extends object> = new(...args: any[]) => T;
type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance:T, constructorArguments:any[])=>void;
export type BeforeHook<T, A extends Array<any>> = (instance:T, methodArguments:A)=>A;
export type AfterHook<T, R = void> = (instance:T, methodResult:R)=>R;
export type MiddlewareHook<T, A extends Array<any>, R = void> = (instance:T, next:(methodArguments:A)=>R, methodArguments:A)=>R;
export type ClassDecorator<T extends object> = <T1 extends T>(clazz:Class<T1>)=> Class<T1>;

function getLazyListProp<O extends object, T>(obj: O, key: keyof O): Array<T> {
    let result = obj[key];
    if (!result) {
        obj[key] = result = [];
    }
    return result;
}

class MixerData<T extends object> {
    // TODO @measure if worth making lazy
    constructorHooks: ConstructorHook<T>[] = [];
    beforeHooks: {[P in keyof T]?:Array<BeforeHook<T, any>>} = {};
    afterHooks: {[P in keyof T]?:Array<AfterHook<T, any>>} = {};
    middlewareHooks: {[P in keyof T]?:Array<MiddlewareHook<T, any, any>>} = {};
    origin: {[P in keyof T]?:T[P] & ((...args: any[])=>any)} = {};

    get hookedMethodNames() {
        return _union(
            Object.keys(this.middlewareHooks),
            Object.keys(this.beforeHooks),
            Object.keys(this.afterHooks)) as Array<keyof T>;
    }
}

type Mixed<T extends object> = {
    $mixerData: MixerData<T>
};

type MixedClass<T extends object> = Class<T> & Mixed<T>;

function chain2<T extends object>(f:ClassDecorator<T>, g:ClassDecorator<T>):ClassDecorator<T>{
    return <T1 extends T>(cls:Class<T1>) => g(f(cls));
}
export function chain<T extends object>(...fns:ClassDecorator<T>[]):ClassDecorator<T>{
    return fns.reduce(chain2);
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

export function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T): ClassDecorator<T>;
export function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target: Class<T>): Class<T>;
export function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.middlewareHooks, methodName).push(hook);
        return mixed;
    }
    return target ? curried(target) : curried;
}

export function before<T extends object>(hook: BeforeHook<T, any>, methodName: keyof T): ClassDecorator<T>;
export function before<T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
export function before<T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.beforeHooks, methodName).push(hook);
        return mixed;
    }
    return target ? curried(target) : curried;
}

export function after<T extends object>(hook: AfterHook<T, any>, methodName: keyof T): ClassDecorator<T>;
export function after<T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
export function after<T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        getLazyListProp(mixed.$mixerData.afterHooks, methodName).unshift(hook);
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
            let that: T;
            if (new.target === Extended) {
                that = new clazz(...args) as any as T;
            } else {
                super(...args);
                that = this as any as T;
            }
            // if not inherited by another class, remove itself so to not pollute instance's name
            activateMixins(that, Extended.$mixerData, args);
            return that;
        }
    }
    Object.defineProperty(Extended, '$mixerData', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new MixerData<T>()
    });
    return Extended as any;
}


function activateMixins<T extends object>(target: T, mixerMeta: MixerData<T>, ctorArgs: any[]) {
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach(
        (cb: ConstructorHook<T>) => cb(target, ctorArgs));

    mixerMeta.hookedMethodNames.forEach((methodName: keyof T) => {
        if (!mixerMeta.origin[methodName]) {
            mixerMeta.origin[methodName] = target[methodName]; // TODO check if same as prototype method
            // TODO named function
            Object.getPrototypeOf(target)[methodName] = function (this: T) {
                let methodArgs: any[] = Array.prototype.slice.call(arguments);
                methodArgs = runBeforeHooks(this, mixerMeta, methodName, methodArgs);
                let methodResult = runMiddlewareHooksAndOrigin(this, mixerMeta, methodName, methodArgs);
                methodResult = runAfterHooks(this, mixerMeta, methodName, methodResult);
                return methodResult;
            };
        }
    });
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

function runMiddlewareHooksAndOrigin<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodArgs: any[]) {
    const originalMethod: (...args: any[])=>any = mixerMeta.origin[methodName]!;
    const middlewareHooks = mixerMeta.middlewareHooks[methodName];
    return (middlewareHooks) ? // should never be an empty array - either undefined or with hook(s)
        middlewareHooks[0](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, 1), methodArgs) :
        (originalMethod && originalMethod.apply(target, methodArgs));
}

function createNextForMiddlewareHook<T extends object, A extends Array<any>, R>(target: T, originalMethod: (...args: any[])=>R, middlewareHooks: Array<MiddlewareHook<T, A, R>>, idx: number) {
    return (...args: any[]): R => {
        return middlewareHooks.length <= idx ?
            (originalMethod && originalMethod.apply(target, args)) :
            middlewareHooks[idx](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, idx + 1), args as A);
    };
}

function runAfterHooks<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodResult: any) {
    const afterHooks = mixerMeta.afterHooks[methodName];
    const devMode = getGlobalConfig()[Flags.DEV_MODE];

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
