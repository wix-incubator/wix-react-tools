import {Increment, IsZero, ObjectHasKey, THCons, THList, THListHead, THListLength, THListReverse, THListTail, THNil} from "typelevel-ts";
export type Class<T extends object> = new(...args: any[]) => T;
export type GlobalConfig = {
    devMode?: boolean;
}

export type NumberToString = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];



export type ApiFunc<L extends THList, C, T = any> = {
    true: (this:T) => C
    false: {
        true: (this:T, a: THListHead<L>) => C
        false: {
            true: (this:T, a: THListHead<L>, b: THListHead<THListTail<L>>) => C
            false: {
                true: (this:T, a: THListHead<L>, b: THListHead<THListTail<L>>, c: THListHead<THListTail<THListTail<L>>>) => C
                false: 'error' // TODO more cases
            }[IsZero<THListLength<THListTail<THListTail<THListTail<L>>>>>]
        }[IsZero<THListLength<THListTail<THListTail<L>>>>]
    }[IsZero<THListLength<THListTail<L>>>]
}[IsZero<THListLength<L>>]

export type THListToCurriedFunction<L extends THList, C> = {
    true: () => C
    false: {
        true: (a: THListHead<L>) => C
        false: {
            true: (a: THListHead<L>) => (b: THListHead<THListTail<L>>) => C
            false: {
                true: (a: THListHead<L>) => (b: THListHead<THListTail<L>>) => (c: THListHead<THListTail<THListTail<L>>>) => C
                false: 'error' // TODO more cases
            }[IsZero<THListLength<THListTail<THListTail<THListTail<L>>>>>]
        }[IsZero<THListLength<THListTail<THListTail<L>>>>]
    }[IsZero<THListLength<THListTail<L>>>]
}[IsZero<THListLength<L>>]

export type Args<A, I = 0, L = THNil> = {
    true: Args<A, Increment[I], THCons<A[I], L>>;
    false: THListReverse<L>;
}[ObjectHasKey<A, I>];
