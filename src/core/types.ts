import {
    Increment,
    IsZero, ObjectHasKey, THCons, THList, THListHead, THListLength, THListReverse, THListTail, THNil,
    TupleToTHList
} from "typelevel-ts";
export type Class<T extends object> = new(...args: any[]) => T;
export type GlobalConfig = {
    devMode?: boolean;
}

export type NumberToString = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export type GFunc<I extends number, A, R=void> = {
    0: () => R
    1: (a0: A[0]) => R
    2: (a0: A[0], a1: A[1]) => R
    3: (a0: A[0], a1: A[1], a2: A[2]) => R
    4: (a0: A[0], a1: A[1], a2: A[2], a3: A[3]) => R
    5: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4]) => R
    6: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4], a5: A[5]) => R
    7: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4], a5: A[5], a6: A[6]) => R
    8: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4], a5: A[5], a6: A[6], a7: A[7]) => R
    9: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4], a5: A[5], a6: A[6], a7: A[7], a8: A[8]) => R
    10: (a0: A[0], a1: A[1], a2: A[2], a3: A[3], a4: A[4], a5: A[5], a6: A[6], a7: A[7], a8: A[8], a9: A[9]) => R
}[NumberToString[I]];

export type THListToFunction<L extends THList, C> = {
    true: () => C
    false: {
        true: (a: THListHead<L>) => C
        false: {
            true: (a: THListHead<L>, b: THListHead<THListTail<L>>) => C
            false: {
                true: (a: THListHead<L>, b: THListHead<THListTail<L>>, c: THListHead<THListTail<THListTail<L>>>) => C
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

export type Func<T, R=void, I = 0, L = THNil> = {
    true: Func<T, R, Increment[I], THCons<T[I], L>>;
    false: THListToFunction<THListReverse<L>, R>;
}[ObjectHasKey<T, I>];
