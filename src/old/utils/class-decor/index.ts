import {Class, ConstructorHook, customMixin, mix, MixedClass, unsafeMixerData} from "./mixer";
import {privateState} from "../../../core/private-state";
import {
    AfterHook,
    BeforeHook,
    EdgeClassData,
    initChildClass,
    isClassDecorMixin,
    MiddlewareHook,
    MixedClassDecor,
    getClassDecorData
} from "./apply-method-decorations";

export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;


function initClassData (clazz:MixedClassDecor<object>){
    const edgeClassData = {} as EdgeClassData<object>;
    edgeClassData.mixerMeta = getClassDecorData(clazz);
    edgeClassData.origin = {};
    initChildClass(edgeClassData, clazz.prototype);
    return edgeClassData;
}

const edgeClassData = privateState('class-decor data', initClassData);
// TODO extract generic onFirstInstance
const initClassOnInstance = onInstance((instance: object) => edgeClassData(instance.constructor as MixedClassDecor<object>));

function initMixedClassDecor<T extends object, C extends MixedClass<T>>(mixed: C): C & MixedClassDecor<object> {
    const classDecorated = mixed as C & MixedClassDecor<object>;
    getClassDecorData(classDecorated).beforeHooks = {};
    getClassDecorData(classDecorated).afterHooks = {};
    getClassDecorData(classDecorated).middlewareHooks = {};

    return initClassOnInstance(classDecorated) as typeof classDecorated;
}

const mixClassDecor: <T extends object, C extends Class<T>>(clazz: C) => C & MixedClassDecor<T>
    = customMixin.bind(null, initMixedClassDecor, isClassDecorMixin);


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


export function onInstance<T extends object>(hook: ConstructorHook<T>): ClassDecorator<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target: Class<T>): Class<T>;
export function onInstance<T extends object>(hook: ConstructorHook<T>, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        unsafeMixerData(mixed).constructorHooks.push(hook);
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

export const middleware = addIfExists(function middleware<T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mixClassDecor<T1, Class<T1>>(t);
        getLazyListProp(getClassDecorData(mixed).middlewareHooks, methodName).push(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: MiddlewareHook<T, any, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>);

export const before = addIfExists(function before<T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>): Class<T1> {
        const mixed = mixClassDecor<T1, Class<T1>>(t);
        getLazyListProp(getClassDecorData(mixed).beforeHooks, methodName).push(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: BeforeHook<T, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: BeforeHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>);

export const after = addIfExists(function after<T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target?: Class<T>): Class<T> | ClassDecorator<T> {
    function curried<T1 extends T>(t: Class<T1>) {
        const mixed = mixClassDecor<T1, Class<T1>>(t);
        getLazyListProp(getClassDecorData(mixed).afterHooks, methodName).unshift(hook);
        return mixed;
    }

    return target ? curried(target) : curried;
} as MethodDecoratorApi<{
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T): ClassDecorator<T>;
    <T extends object>(hook: AfterHook<T, any>, methodName: keyof T, target: Class<T>): Class<T>;
}>);
