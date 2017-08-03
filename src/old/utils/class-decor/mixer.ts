import {privateState, StateProvider} from '../../../core/private-state';

export type Class<T extends object> = {
    prototype:T;
    new(...args: any[]): T
};
type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;

type MixerDataProvider =
    {<T extends object>(targetObj: Class<T>): MixerData<T>} &
    StateProvider<MixerData<object>, Class<object>>;

function getSuper<P extends object, C extends P = P>(c: Class<C>): Class<P>{
    return Object.getPrototypeOf(c.prototype).constructor;
}

const directMixerData = privateState('mixer data', <T extends object>(c:Class<T>) => {
    const superClass = getSuper<T>(c);
    return new MixerData<T>(c, superClass);
}) as MixerDataProvider;

export function inheritedMixerData<T extends object>(clazz: Class<T>): MixerData<Partial<T>> | null {
    while (clazz as Class<object> !== Object) {
        if (directMixerData.hasState(clazz)) {
            return directMixerData(clazz);
        }
        clazz = Object.getPrototypeOf(clazz.prototype).constructor;
    }
    return null;
}

export function unsafeMixerData<T extends object>(clazz: Class<T>): MixerData<T> {
    if (directMixerData.hasState(clazz)) {
        return directMixerData(clazz);
    }
    throw new Error(`unexpected: class ${clazz.name} does not have mixer data`);
}

export function unsafeInheritedMixerData<T extends object>(clazz: Class<T>): MixerData<Partial<T>> {
    let data = inheritedMixerData(clazz);
    if (data) {
        return data;
    }
    throw new Error(`unexpected: class ${clazz.name} does not inherit any mixer data`);
}

export function customMixin<T extends object, M extends MixedClass<any>, C extends Class<T>>
(init: <C extends MixedClass<T>>(m: C) => C & M, isValid: (m: MixedClass<T>) => m is M, clazz: C): C & M {
    const result = mix<T, C>(clazz);
    if (isValid(result)) {
        return result;
    } else {
        return init(result);
    }
}

export function mix<T extends object, C extends Class<T>>(clazz: C): C & MixedClass<T> {
    // de-dup class creation
    // but don't de-dup if $mixerData was inherited
    if (directMixerData.hasState(clazz)) {
        // https://github.com/wix/react-bases/issues/10
        return clazz as C & MixedClass<T>;
    }
    class Extended extends (clazz as any as DumbClass) {
        static isMixed: boolean = true;
        static readonly $mixerData: MixerData<T>;

        constructor(...args: any[]) {
            super(...args);
            // if not inherited by another class, remove itself so to not pollute instance's name
            activateMixins(this as any as T, directMixerData(Extended), args);
        }
    }
    // TODO remove this ineffective dirty fix, see https://github.com/wix/react-bases/issues/50
    Object.defineProperty(Extended, 'name', {
        enumerable: false,
        writable: false,
        value: clazz.name
    });
    // initialize mixer data on Extended
    directMixerData(Extended);
    return Extended as any;
}

export type MixedClass<T extends object> = Class<T>;


export class MixerData<T extends object> {
    readonly superData: MixerData<Partial<T>>;
    constructorHooks: ConstructorHook<T>[] = [];

    constructor(public mixinClass: MixedClass<T>, originClass: Class<T>) {
        const ancestorMixerData = inheritedMixerData(originClass);
        if (ancestorMixerData) {
            this.superData = ancestorMixerData;
        }
    }

    getParentOf<M extends MixedClass<T>>(isValid: (m: MixedClass<T>) => m is M): M | undefined {
        let next: MixerData<T>;
        while (next = this.superData as any) {
            if (isValid(next.mixinClass)) {
                return next.mixinClass;
            }
        }
        return undefined;
    }
}

function activateMixins<T extends object>(target: T, mixerMeta: MixerData<T>, ctorArgs: any[]) {
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach(
        (cb: ConstructorHook<T>) => cb(target, ctorArgs));
}
