export type Class<T extends object> = {
    prototype: T;
    new(...args: any[]): T
};

export function isAnyClass(func: any): func is Class<object> {
    return func.prototype && func.prototype.constructor === func;
}

export function isClass<T extends object>(protoValidator: (proto: object) => proto is T, func: Function): func is Class<T> {
    return func.prototype && (func.prototype.constructor === func) && protoValidator(func.prototype);
}

export type Instance<T extends object, C extends Class<T> = Class<T>> = T & {
    constructor: C & Class<Instance<T>>;
}

export type GlobalConfig = {
    devMode?: boolean;
}

export type NotNull = object | number | boolean | string;

export interface TypedPropertyDescriptor<T> {
    configurable?: boolean;
    enumerable?: boolean;
    value?: T;
    writable?: boolean;

    get? (): T;

    set? (v: T): void;
}

export type TypedPropertyDescriptorMap<T extends object> = {
    [P in keyof T]: TypedPropertyDescriptor<T[P]>;
    } & PropertyDescriptorMap;
