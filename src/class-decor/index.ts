import {
    ConstructorHook,
    inheritedMixerData,
    mix,
    unsafeMixerData
} from "./mixer";
import {Class, TypedPropertyDescriptorMap} from "../core/types";
import {AfterHook, BeforeHook, MiddlewareHook} from "../functoin-decor/index";

export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;

function chain2<T extends object>(f: ClassDecorator<T>, g: ClassDecorator<T> | undefined): ClassDecorator<T> {
    return g ? <T1 extends T>(cls: Class<T1>) => g(f(cls)) : f;
}
export function chain<T extends object>(...fns: (ClassDecorator<T>)[]): ClassDecorator<T> {
    return fns.reduce(chain2);
}


export function onInstance<T extends object>(hook: ConstructorHook<T>): ClassDecorator<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target: Class<T>): Class<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        unsafeMixerData(mixed).addConstructorHook(hook);
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

export function defineProperties<T extends object>(properties: TypedPropertyDescriptorMap<T>): ClassDecorator<T>;
export function defineProperties<T extends object, T1 extends T>(properties: TypedPropertyDescriptorMap<T>, target: Class<T1>): Class<T1>;
export function defineProperties<T extends object, T1 extends T>(properties: TypedPropertyDescriptorMap<T>, target?: Class<T1>): Class<T1> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        Object.defineProperties(mixed.prototype, properties);
        return mixed;
    }

    return target ? curried(target) : curried;
}

export type MethodDecoratorApi<T extends Function> = T & {
    ifExists: T;
}

// This method assumes originDecorator accepts the hook as first argument
function addIfExists<T extends Function>(originDecorator: T): MethodDecoratorApi<T> {
    const result = originDecorator as MethodDecoratorApi<T>;
    result.ifExists = function ifExists(...args: any[]) {
        const hook = args[0];
        hook.ifExists = true;
        return originDecorator(...args);
    } as Function as  T;
    return result;
}

export const middleware = addIfExists(function middleware<T extends object>(hook: MiddlewareHook<any, T>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix<T1, Class<T1>>(t);
        inheritedMixerData.unsafe(mixed).addMiddlewareHook(hook, methodName);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: MiddlewareHook<any, T>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: MiddlewareHook<any, T>, methodName: keyof T, target: Class<T>): Class<T>;
}>);

export const before = addIfExists(function before<T extends object>(hook: BeforeHook<T>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>): Class<T1> {
        const mixed = mix<T1, Class<T1>>(t);
        inheritedMixerData.unsafe(mixed).addBeforeHook(hook, methodName);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: BeforeHook<T>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: BeforeHook<T>, methodName: keyof T, target: Class<T>): Class<T>;
}>);

export const after = addIfExists(function after<T extends object>(hook: AfterHook<any, T>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix<T1, Class<T1>>(t);
        inheritedMixerData.unsafe(mixed).addAfterHook(hook, methodName);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: AfterHook<any, T>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: AfterHook<any, T>, methodName: keyof T, target: Class<T>): Class<T>;
}>);
