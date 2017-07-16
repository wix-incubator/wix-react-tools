export type Class<T extends object> = new(...args: any[]) => T;
type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;

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
    if (isMixedClass<T>(clazz)) {
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
        value: new MixerData<T>(Extended as any)
    });
    // TODO remove this ineffective dirty fix, see https://github.com/wix/react-bases/issues/50
    Object.defineProperty(Extended, 'name', {
        enumerable: false,
        writable: false,
        value: clazz.name
    });
    return Extended as any;
}

export type MixedClass<T extends object> = Class<T> & {
    $mixerData: MixerData<T>
    prototype: T;
};


export class MixerData<T extends object> {
    readonly superData: MixerData<Partial<T>>;
    constructorHooks: ConstructorHook<T>[] = [];

    constructor(public mixinClass: MixedClass<T>) {
        if (isMixedClass(mixinClass)) {
            this.superData = mixinClass.$mixerData;
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

function isMixedClass<T extends object>(clazz: Class<T>): clazz is MixedClass<T> {
    return !!(clazz as MixedClass<T>).$mixerData;
}

function activateMixins<T extends object>(target: T, mixerMeta: MixerData<T>, ctorArgs: any[]) {
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach(
        (cb: ConstructorHook<T>) => cb(target, ctorArgs));


}
