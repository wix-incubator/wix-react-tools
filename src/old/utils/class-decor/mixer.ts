import {Class} from "../../../core/types";
import {classPrivateState, ClassStateProvider} from "../../../core/class-private-state";
import {initEdgeClass} from "./apply-method-decorations";
import {THList, THListToTuple} from "typelevel-ts";
import _union = require('lodash/union');

type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;
export type BeforeMethodHook<A extends THList, T = any> = (instance: T, methodArguments: THListToTuple<A>) => THListToTuple<A>;
export type AfterMethodHook<R = void, T = any> = (instance: T, methodResult: R) => R;
export type MiddlewareMethodHook<A extends THList, R = void, T = any> = (instance: T, next: (methodArguments: THListToTuple<A>) => R, methodArguments: THListToTuple<A>) => R;

export type MixerDataProvider = {
    <T extends object>(targetObj: Class<T>): MixerData<T>;
    unsafe<T extends object>(targetObj: Class<T>): MixerData<T>;
    inherited: {
        <T extends object>(targetObj: Class<T>): MixerData<T> | null;
        unsafe<T extends object>(targetObj: Class<T>): MixerData<T>;
    }
} & ClassStateProvider<MixerData<object>, Class<object>>;

function getSuper<T extends object, C extends T = T>(c: Class<C>): Class<T> {
    return Object.getPrototypeOf(c.prototype).constructor;
}

const getMixerData = classPrivateState<MixerData<object>>('mixer data', <T extends object>(c: Class<T>) => {
    const superClass = getSuper<T>(c);
    return new MixerData<T>(c, superClass);
}) as MixerDataProvider;

export const unsafeMixerData: MixerDataProvider['unsafe'] = getMixerData.unsafe;
export const inheritedMixerData: MixerDataProvider['inherited'] = getMixerData.inherited;

export function mix<T extends object, C extends Class<T>>(clazz: C): C {
    // de-dup class creation
    if (getMixerData.hasState(clazz)) {
        // https://github.com/wix/react-bases/issues/10
        return clazz;
    }
    class Extended extends (clazz as any as DumbClass) {
        static isMixed: boolean = true;
        static readonly $mixerData: MixerData<T>;

        constructor(...args: any[]) {
            super(...args);
            getMixerData(Extended)
                .visitConstructorHooks((cb: ConstructorHook<T>) => cb(this as any as T, args));
        }
    }
    // TODO remove this ineffective dirty fix, see https://github.com/wix/react-bases/issues/50
    Object.defineProperty(Extended, 'name', {
        enumerable: false,
        writable: false,
        value: clazz.name
    });
    // initialize mixer data on Extended
    getMixerData(Extended);
    return Extended as any;
}

export type FlaggedArray<T> = Array<{
    ifExists?: boolean;
} & T>


function getLazyListProp<O extends object, T extends keyof O>(obj: O, key: keyof O) {
    let result = obj[key];
    if (!result) {
        obj[key] = result = [];
    }
    return result;
}

export type LazyLists<T, H> = {[P in keyof T]?:FlaggedArray<H>}

export class MixerData<T extends object> {
    private constructorHooks: ConstructorHook<T>[] = [];
    private beforeHooks: LazyLists<T, BeforeMethodHook<any, T>> = {};
    private afterHooks: LazyLists<T, AfterMethodHook<any, T>> = {};
    private middlewareHooks: LazyLists<T, MiddlewareMethodHook<any, any, T>> = {};

    constructor(public mixedClass: Class<T>, public userClass: Class<T>) {
        // TODO: generalize initEdgeClass to a new type of hook (once per edge class)
        if (!getMixerData.inherited.hasState(userClass)) {
            const onClassInit = (firstInstance: T) => {
                initEdgeClass(firstInstance.constructor as Class<T>);
            };
            // if this is the first class in the hierarchy to be mixed
            this.addConstructorHook(onClassInit);
        }
    }

    get superData(): MixerData<Partial<T>> | null {
        return getMixerData.inherited(this.userClass);
    }

    hookedMethodNames(): Array<keyof T> {

        return _union(
            (this.superData && this.superData.hookedMethodNames()),
            Object.keys(this.middlewareHooks),
            Object.keys(this.beforeHooks),
            Object.keys(this.afterHooks)) as Array<keyof T>;
    }

    addConstructorHook(hook: ConstructorHook<T>) {
        this.constructorHooks.push(hook);
    }

    addBeforeHook(hook: BeforeMethodHook<any, T>, methodName: keyof T) {
        getLazyListProp(this.beforeHooks, methodName)!.push(hook);
    }

    addAfterHook(hook: AfterMethodHook<any, T>, methodName: keyof T) {
        getLazyListProp(this.afterHooks, methodName)!.unshift(hook);
    }

    addMiddlewareHook(hook: MiddlewareMethodHook<any, any, T>, methodName: keyof T) {
        getLazyListProp(this.middlewareHooks, methodName)!.push(hook);
    }

    shouldCreateMethod(methodName: keyof T): boolean {
        return (this.superData && this.superData.shouldCreateMethod(methodName)) ||
            _union(
                this.beforeHooks[methodName],
                this.middlewareHooks[methodName],
                this.afterHooks[methodName]
            ).some((hook) => !hook.ifExists);
    }

    visitConstructorHooks(visitor: (value: ConstructorHook<T>) => void) {
        this.constructorHooks && this.constructorHooks.forEach(visitor);
    }

    collectBeforeHooks(methodName: keyof T): Array<BeforeMethodHook<any, T>> | undefined {
        const parentHooks = this.superData && this.superData.collectBeforeHooks(methodName);
        const thisHooks = this.beforeHooks[methodName];
        if (parentHooks) {
            // notice: after order is reversed to before order
            return thisHooks ? _union(parentHooks, thisHooks) : parentHooks;
        }
        return thisHooks;
    }

    collectAfterHooks(methodName: keyof T): Array<AfterMethodHook<any, T>> | undefined {
        const parentHooks = this.superData && this.superData.collectAfterHooks(methodName);
        const thisHooks = this.afterHooks[methodName];
        if (parentHooks) {
            // notice: after order is reversed to before order
            return thisHooks ? _union(thisHooks, parentHooks) : parentHooks;
        }
        return thisHooks;
    }

    collectMiddlewareHooks(methodName: keyof T): Array<MiddlewareMethodHook<any, any, T>> | undefined {
        const parentHooks = this.superData && this.superData.collectMiddlewareHooks(methodName);
        const thisHooks = this.middlewareHooks[methodName];
        if (parentHooks) {
            return thisHooks ? _union(parentHooks, thisHooks) : parentHooks;
        }
        return thisHooks;
    }
}
