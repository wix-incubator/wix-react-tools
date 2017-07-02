import {lifeCycleHook} from "../mixin-orchestrator";
import _map = require('lodash/map');

export type Hook<T> = (target: T, args:any[]) => void;

export type Class<T> = new(...args: any[]) => T;
export type DumbClass = new(...args: any[]) => object;

export class MixerMeta<T> {

    // TODO @measure if worth making lazy
    // @lazyField
    constructorHooks: Hook<T>[] = [];
    // get constructorHooks(): Hook<T>[] {
    //     const value: Hook<T>[] = [];
    //     Object.defineProperty(this, 'constructorHooks', {value});
    //     return value;
    // };

    //   lifeCycleHooks?: lifeCycleHooks<T>;
}

export type Mixed<T> = {
    $mixerMeta: MixerMeta<T>
};

export type MixedClass<T> = Class<T> & Mixed<T>;

/**
 *
 * @param target the class to register
 * @param cb
 * @returns {MixedClass<T>} the extended class (that should be returned from the decorator)
 */
export function registerForConstructor<T>(target: Class<T> | MixedClass<T>, cb: Hook<T>): MixedClass<T> {
    const mixed = mix(target);
    mixed.$mixerMeta.constructorHooks.push(cb);
    return mixed;
}

export function registerBeforeMethod<T>(target: Class<T> | MixedClass<T>, methodName: keyof T, cb: Hook<T>): MixedClass<T> {
    const mixed = mix(target);
    mixed.$mixerMeta.constructorHooks.push(cb);
    return mixed;
}

function isMixed<T>(subj: any): subj is Mixed<T> {
    return subj.isMixed;
}

export function mix<T>(clazz: Class<T>): MixedClass<T> {
    if (isMixed<T>(clazz)) {
        return clazz;
    }
    class Extended extends (clazz as any as DumbClass) {
        static isMixed: boolean = true;
        static readonly $mixerMeta: MixerMeta<T>;

        constructor(...args: any[]) {
            let that: T;
            if (new.target === Extended) {
                that = new clazz(...args) as any as T;
            } else {
                super(...args);
                that = this as any as T;
            }
            // if not inherited by another class, remove itself so to not pollute instance's name
            activateMixins(that, Extended.$mixerMeta, args);
            return that;
        }
    }
    Object.defineProperty(Extended, '$mixerMeta', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new MixerMeta<T>()
    });
    return Extended as any;
}

function activateMixins<T>(target: T, mixerMeta: MixerMeta<T>, args:any[]) {
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach((cb: Hook<any>) => cb(target, args));
}
