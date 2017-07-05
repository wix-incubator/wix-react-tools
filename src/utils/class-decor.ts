import _union = require('lodash/union');
import _isArrayLikeObject = require('lodash/isArrayLikeObject');

export type Class<T extends object> = new(...args: any[]) => T;
type DumbClass = new(...args: any[]) => object;

// see https://github.com/Microsoft/TypeScript/issues/16931
export type Method<R = void> = (...args:any[]) => R;
export type Method0<R = void> = () => R;
export type Method1<T1, R = void> = (t1: T1) => R;
export type Method2<T1, T2, R = void> = (t1: T1, t2: T2) => R;
export type Method3<T1, T2, T3, R = void> = (t1: T1, t2: T2, t3: T3) => R;
export type Method4<T1, T2, T3, T4, R = void> = (t1: T1, t2: T2, t3: T3, t4: T4) => R;

export type ConstructorHook<T extends object> = Method2<T, any[]>;
export type BeforeHook<T, A extends Array<any>> = Method2<T, A, A>;
export type AfterHook<T, R = void> = Method2<T, R, R>;
export type MiddlewareHook<T, A extends Array<any>, R = void> = Method3<T, Method<R>, A, R>;

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
    origin: {[P in keyof T]?:T[P]&Method<any>} = {};

    get hookedMethodNames(){
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

export function preConstruct<T extends object>(target: Class<T>, cb: ConstructorHook<T>): Class<T> {
    const mixed = mix(target);
    mixed.$mixerData.constructorHooks.push(cb);
    return mixed;
}

export function before<T extends object>(target: Class<T>, methodName: keyof T, cb: BeforeHook<T, any>): Class<T> {
    const mixed = mix(target);
    getLazyListProp(mixed.$mixerData.beforeHooks, methodName).push(cb);
    return mixed;
}

export function after<T extends object>(target: Class<T>, methodName: keyof T, cb: AfterHook<T, any>): Class<T> {
    const mixed = mix(target);
    getLazyListProp(mixed.$mixerData.afterHooks, methodName).unshift(cb);
    return mixed;
}

export function middleware<T extends object>(target: Class<T>, methodName: keyof T, cb: MiddlewareHook<T, any, any>): Class<T> {
    const mixed = mix(target);
    getLazyListProp(mixed.$mixerData.middlewareHooks, methodName).push(cb);
    return mixed;
}

function isMixed<T>(subj: any): subj is Mixed<T> {
    return subj.isMixed;
}

function mix<T extends object>(clazz: Class<T>): MixedClass<T> {
    if (isMixed<T>(clazz)) {
        // TODO override $mixerData to allow multiple child classes
        // TODO handle inheritance tree of decorators
        /*
         @mix1
         class Super {}

         @mix2
         class Child1 extends Super{}


         class Child2 extends Super{} // mix2 applies!

         */
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
        mixerMeta.origin[methodName] = target[methodName]; // TODO check if same as prototype method
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
    const originalMethod: Method<any> = mixerMeta.origin[methodName]!;
    const middlewareHooks = mixerMeta.middlewareHooks[methodName];
    return (middlewareHooks)? // should never be an empty array - either undefined or with hook(s)
        middlewareHooks[0](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, 1), methodArgs) :
        originalMethod.apply(target, methodArgs);
}

function createNextForMiddlewareHook<T extends object, A extends Array<any>, R>(target: T, originalMethod: Method<R>, middlewareHooks: Array<MiddlewareHook<T, A, R>>, idx: number){
    return (...args: any[]):R => {
        return middlewareHooks.length <= idx ?
            originalMethod.apply(target, args) :
            middlewareHooks[idx](target, createNextForMiddlewareHook(target, originalMethod, middlewareHooks, idx + 1), args as A);
    };
}

function runAfterHooks<T extends object>(target: T, mixerMeta: MixerData<T>, methodName: keyof T, methodResult: any) {
    const afterHooks = mixerMeta.afterHooks[methodName];
    if (afterHooks) {
        afterHooks.forEach((hook: AfterHook<T, typeof methodResult>) => {
            methodResult = hook(target, methodResult);
        });
    }
    return methodResult;
}
