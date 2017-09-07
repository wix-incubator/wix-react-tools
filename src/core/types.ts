export type Class<T extends object> = {
    prototype: T;
    new(...args: any[]): T
};

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

export type NumberToString = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
