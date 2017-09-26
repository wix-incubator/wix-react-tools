import memoize = require('memoize-weak');

function chain<T extends Function>(first: T, last: T): T {
    return function chained(this: any, ...args: any[]) {
        first.apply(this, args);
        last.apply(this, args);
    } as any as T;
}

export type Chain = <T extends Function>(first: T, last: T) => T;
export const chainFunctions =  chain as Chain & {cached : Chain};
chainFunctions.cached = memoize(chain);

export const cachedChainFunctions = function chained(this: any, ...args: any[]) {
    console.warn(`cachedChainFunctions() is deprecated, use chainFunctions.cached() instead`);
    return chainFunctions.cached.apply(this, args);
} as Chain;
