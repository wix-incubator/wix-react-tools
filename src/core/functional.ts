import memoize = require('memoize-weak');
import {Class} from "./types";
import {ClassDecorator} from "../class-decor/index";

function serialize2Functions<T extends Function>(first: T, last: T): T {
    return function chained(this: any, ...args: any[]) {
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}

export type Serializer = <T extends Function>(first: T, last: T) => T;
export const serialize = serialize2Functions as Serializer & { cached: Serializer };
serialize.cached = memoize(serialize2Functions);

function compose2<T extends object>(f: ClassDecorator<T>, g: ClassDecorator<T> | undefined): ClassDecorator<T> {
    return g ? <T1 extends T>(cls: Class<T1>) => g(f(cls)) : f;
}

export function chain<T extends object>(...fns: (ClassDecorator<T>)[]): ClassDecorator<T> {
    return fns.reduce(compose2);
}
