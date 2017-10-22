import memoize = require('memoize-weak');
import {Class} from "./types";
import {ClassFeature} from "../class-decor/index";

function serialize2Functions<T extends Function>(first: T, last: T): T {
    return function chained(this: any, ...args: any[]) {
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}

export type Serializer = <T extends Function>(first: T, last: T) => T;
export const serialize = serialize2Functions as Serializer & { cached: Serializer };
serialize.cached = memoize(serialize2Functions);

function compose2<T extends object>(f: ClassFeature<T>, g: ClassFeature<T> | undefined): ClassFeature<T> {
    return g ? <C extends Class<T>>(cls: C) => g(f(cls)) : f;
}

export function chain<T extends object>(...fns: (ClassFeature<T>)[]): ClassFeature<T> {
    return fns.reduce(compose2);
}
