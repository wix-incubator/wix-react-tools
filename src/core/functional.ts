import memoize = require('memoize-weak');

export function chainFunctions<T extends Function>(first: T, last: T): T {
    return function chained(this: any, ...args: any[]) {
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}
export const cachedChainFunctions = memoize(chainFunctions);
