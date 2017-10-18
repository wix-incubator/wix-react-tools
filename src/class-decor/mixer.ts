import {Class, Instance} from "../core/types";
import {classPrivateState, ClassStateProvider} from "../core/class-private-state";
import {initEdgeClass} from "./apply-method-decorations";
import {AfterHook, BeforeHook, FunctionMetaData, MiddlewareHook} from "../functoin-decor/index";

type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (this: T, constructorArguments: any[]) => void;

export type MixerDataProvider = {
    <T extends object>(targetObj: Class<T>): MixerData<Instance<T>>;
    unsafe<T extends object>(targetObj: Class<T>): MixerData<Instance<T>>;
    inherited: {
        <T extends object>(targetObj: Class<T>): MixerData<Instance<T>> | null;
        unsafe<T extends object>(targetObj: Class<T>): MixerData<Instance<T>>;
    }
} & ClassStateProvider<MixerData<Instance<object>>, Class<object>>;

function getSuper<T extends object, C extends T = T>(c: Class<C>): Class<T> {
    return Object.getPrototypeOf(c.prototype).constructor;
}

const getMixerData = classPrivateState<MixerData<Instance<object>>>('mixer data', <T extends Instance<object>>(c: Class<T>) => {
    // one time per wrapping class
    const superClass = getSuper<T>(c);
    return new MixerData<T>(superClass);
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
        constructor(...args: any[]) {
            super(...args);
            getMixerData(Extended).visitConstructorHooks((cb: ConstructorHook<Instance<T>>) => cb.call(this as any as T, args));
        }
    }

    // initialize mixer data on Extended
    getMixerData(Extended);
    return Extended as any;
}

export class List<T> {
    private items: T[] = [];

    constructor(protected superList: List<T> | null) {
    }

    add(hook: T) {
        if (!this.has(hook)) {
            this.items.push(hook);
        }
    }

    collect(): T[] {
        const result: T[] = [];
        this.collectInternal(result);
        return result;
    }

    private has(hook: T): boolean {
        return Boolean(~this.items.indexOf(hook) || (this.superList && this.superList.has(hook)));
    }

    private collectInternal(collector: T[]) {
        this.superList && this.superList.collectInternal(collector);
        collector.push(...this.items);
    }
}

type MethodMeta = {
    middleware?: List<MiddlewareHook>;
    before?: List<BeforeHook>;
    after?: List<AfterHook>;
}

/**
 * type dictionary - maps name of hook to its type
 */
type Hooks = {
    middleware: MiddlewareHook;
    before: BeforeHook;
    after: AfterHook;
}

function onClassInit(this: object) {
    initEdgeClass(this.constructor as Class<object>);
}

export class MixerData<T extends object> {
    private superData: MixerData<Partial<T>> | null;
    private constructorHooks: ConstructorHook<T>[] = [];
    private functions: { [P: string]: MethodMeta } = {};
    private methodNames: List<keyof T>;

    constructor(userClass: Class<T>) {
        this.superData = getMixerData.inherited(userClass);
        this.methodNames = new List(this.superData && this.superData.methodNames);
        // TODO: generalize initEdgeClass to a new type of hook (once per edge class)
        if (!this.superData) {
            // if this is the first class in the hierarchy to be mixed
            this.addConstructorHook(onClassInit);
        }
    }

    hookedMethodNames(): Array<keyof T> {
        return this.methodNames.collect();
    }

    getMethodHooks(methodName: keyof T): FunctionMetaData | null {
        const before = this.getInherited((toCheck: MixerData<any>) => toCheck.functions[methodName] && toCheck.functions[methodName].before);
        const after = this.getInherited((toCheck: MixerData<any>) => toCheck.functions[methodName] && toCheck.functions[methodName].after);
        const middleware = this.getInherited((toCheck: MixerData<any>) => toCheck.functions[methodName] && toCheck.functions[methodName].middleware);
        if (before || after || middleware) {
            return {
                name: methodName,
                before: before && before.collect(),
                after: after && after.collect().reverse(),
                middleware: middleware && middleware.collect()
            }
        } else {
            return null;
        }
    }

    addConstructorHook(hook: ConstructorHook<T>) {
        this.constructorHooks.push(hook);
    }

    visitConstructorHooks(visitor: (value: ConstructorHook<T>) => void) {
        this.constructorHooks && this.constructorHooks.forEach(visitor);
    }

    addBeforeHook(hook: BeforeHook<T>, methodName: keyof T) {
        this.addToList('before', methodName, hook);
    }

    addAfterHook(hook: AfterHook<any, T>, methodName: keyof T) {
        this.addToList('after', methodName, hook);
    }

    addMiddlewareHook(hook: MiddlewareHook<any, T>, methodName: keyof T) {
        this.addToList('middleware', methodName, hook);
    }

    /**
     * searches up the inheritance tree for a property
     */
    private getInherited<P>(provider: (toCheck: MixerData<any>) => P | undefined): P | null {
        let currentData: MixerData<any> = this;
        let result = provider(currentData);
        while (result === undefined && currentData.superData) {
            currentData = currentData.superData;
            result = provider(currentData);
        }
        return result === undefined ? null : result;
    }

    private addToList<H extends keyof Hooks>(name: H, key: keyof T, hook: Hooks[H]) {
        this.methodNames.add(key);
        if (!this.functions[key]) {
            this.functions[key] = {};
        }
        let result: List<Hooks[H]> | undefined = this.functions[key][name];
        if (!result) {
            let inherited = this.getInherited<List<Hooks[H]>>(
                (toCheck: MixerData<any>) => toCheck.functions[key] && toCheck.functions[key][name]);
            result = new List<Hooks[H]>(inherited);
            this.functions[key][name] = result as any;
        }
        result.add(hook);
    }
}
