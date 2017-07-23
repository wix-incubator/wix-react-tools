import memoize = require('memoize-weak');

export function mergeHandlers<T extends Function>(first:T, last:T):T{
    return function merged(this:any, ...args:any[]){
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}

export const mergeEvents = memoize(mergeHandlers);
