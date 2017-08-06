import {Class} from "../../../core/types";
import {classPrivateState, ClassStateProvider} from "../../../core/class-private-state";

type DumbClass = new(...args: any[]) => object;

export type ConstructorHook<T extends object> = (instance: T, constructorArguments: any[]) => void;

type MixerDataProvider = {
        <T extends object>(targetObj: Class<T>): MixerData<T>
        unsafe<T extends object>(targetObj:  Class<T>): MixerData<T>;
    } & ClassStateProvider<MixerData<object>, Class<object>>;

function getSuper<T extends object, C extends T = T>(c: Class<C>): Class<T>{
    return Object.getPrototypeOf(c.prototype).constructor;
}

const getMixerData = classPrivateState('mixer data', <T extends object>(c:Class<T>) => {
    const superClass = getSuper<T>(c);
    return new MixerData<T>(c, superClass);
}) as MixerDataProvider;

export const unsafeMixerData = getMixerData.unsafe;

export function mix<T extends object, C extends Class<T>>(clazz: C): C {
    // de-dup class creation
    // but don't de-dup if $mixerData was inherited
    if (getMixerData.hasState(clazz)) {
        // https://github.com/wix/react-bases/issues/10
        return clazz;
    }
    class Extended extends (clazz as any as DumbClass) {
        static isMixed: boolean = true;
        static readonly $mixerData: MixerData<T>;

        constructor(...args: any[]) {
            super(...args);
            // if not inherited by another class, remove itself so to not pollute instance's name
            activateMixins(this as any as T, getMixerData(Extended), args);
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

export class MixerData<T extends object> {
    readonly superData: MixerData<Partial<T>>;
    constructorHooks: ConstructorHook<T>[] = [];

    constructor(public mixinClass: Class<T>, originClass: Class<T>) {
        const ancestorMixerData = getMixerData.inherited(originClass);
        if (ancestorMixerData) {
            this.superData = ancestorMixerData;
        }
    }

    getParentOf<M extends Class<T>>(isValid: (m: Class<T>) => m is M): M | undefined {
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
