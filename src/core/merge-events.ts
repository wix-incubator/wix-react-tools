import memoize = require('memoize-weak');

export function serializeFunctions<T extends Function>(first:T, last:T):T{
    return function serialized(this:any, ...args:any[]){
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}

export const mergeEventHandlers = memoize(serializeFunctions);
