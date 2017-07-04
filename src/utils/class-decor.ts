import _union = require('lodash/union');

export type Hook<T extends object> = (target: T, args: any[]) => void;

export type Class<T extends object> = new(...args: any[]) => T;
export type DumbClass = new(...args: any[]) => object;


export type BeforeHook<T, A extends Array<any>> = (target: T, args: A) => A;
export type AfterHook<T, R = void> = (target: T, res: R) => R;

function getLazyListProp<O extends object, T>(obj: O, key: keyof O): Array<T> {
    let result = obj[key];
    if (!result) {
        obj[key] = result = [];
    }
    return result;
}

export class MixerData<T extends object> {
    // get constructorHooks(): Hook<T>[] {
    //     const value: Hook<T>[] = [];
    //     Object.defineProperty(this, 'constructorHooks', {value});
    //     return value;
    // };

    // TODO @measure if worth making lazy
    // @lazyField
    constructorHooks: Hook<T>[] = [];
    beforeHooks: {[P in keyof T]?:Array<BeforeHook<T, any>>} = {};
    afterHooks: {[P in keyof T]?:Array<AfterHook<T, any>>} = {};

    origin: {[P in keyof T]?:Function} = {};
    get hookedMethodNames():Array<keyof T>{
        return _union(Object.keys(this.beforeHooks), Object.keys(this.afterHooks)) as Array<keyof T>;
    }
}

export type Mixed<T extends object> = {
    $mixerData: MixerData<T>
};

export type MixedClass<T extends object> = Class<T> & Mixed<T>;

/**
 *
 * @param target the class to register
 * @param cb
 * @returns {MixedClass<T>} the extended class (that should be returned from the decorator)
 */
export function registerForConstructor<T extends object>(target: Class<T> | MixedClass<T>, cb: Hook<T>): MixedClass<T> {
    const mixed = mix(target);
    mixed.$mixerData.constructorHooks.push(cb);
    return mixed;
}

export function registerBeforeMethod<T extends object>(target: Class<T> | MixedClass<T>, methodName: keyof T, cb: BeforeHook<T, any>): MixedClass<T> {
    const mixed = mix(target);
    getLazyListProp(mixed.$mixerData.beforeHooks, methodName).push(cb);
    return mixed;
}

export function registerAfterMethod<T extends object>(target: Class<T> | MixedClass<T>, methodName: keyof T, cb: AfterHook<T, any>): MixedClass<T> {
    const mixed = mix(target);
    getLazyListProp(mixed.$mixerData.afterHooks, methodName).unshift(cb);
    return mixed;
}

function isMixed<T>(subj: any): subj is Mixed<T> {
    return subj.isMixed;
}

export function mix<T extends object>(clazz: Class<T>): MixedClass<T> {
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
    mixerMeta.constructorHooks && mixerMeta.constructorHooks.forEach((cb: Hook<any>) => cb(target, ctorArgs));
    mixerMeta.hookedMethodNames.forEach((methodName: keyof T) => {
        mixerMeta.origin[methodName] = target[methodName]; // TODO check if same as prototype method
        // TODO named function
        Object.getPrototypeOf(target)[methodName] = function (this: T, ...methodArgs: any[]) {
            const beforeHooks = mixerMeta.beforeHooks[methodName];
            if (beforeHooks) {
                beforeHooks.forEach((hook: BeforeHook<T, typeof methodArgs>) => {
                    const result = hook(this, methodArgs);
                    if (Array.isArray(result)) {
                        methodArgs = result;
                    }
                });
            }
            let res = mixerMeta.origin[methodName]!.apply(this, methodArgs);
            const afterHooks = mixerMeta.afterHooks[methodName];
            if (afterHooks) {
                afterHooks.forEach((hook: AfterHook<T, typeof res>) => {
                    const result = hook(this, res);
                    if (result !== undefined) {
                        res = result;
                    }
                });
            }
            return res;
        };
    });
}
