// import {
//     _0,
//     _1,
//     _2, _3, _4, _5, _6, _7, _8, _9,
//     Increment,
//     Nat,
//     ObjectHasKey,
//     THCons,
//     THList,
//     THListIsTHNil,
//     THListReverse,
//     THListTail,
//     THNil,
//     UnsafeTHListGet
// } from "typelevel-ts";
import { Component } from 'react';
export type THList = any;
export type Nat = any;
export type THNil = any;
export type THCons<T,S> = any;
export type UnsafeTHListGet<T,S> = any;

export type Class<T extends object> = {
    prototype:T;
    new(...args: any[]): T
};

export function isClass<T extends object>(protoValidator: (proto:object)=>proto is T, func:Function):func is Class<T>{
    return func.prototype && (func.prototype.constructor === func) && protoValidator(func.prototype);
}
export type RenderResult = JSX.Element | null | false;

export type Instance<T extends object, C extends Class<T> = Class<T>> = T & {
    constructor: C & Class<Instance<T>>;
}

export type Rendered<P extends object> = Component<P>
// export type Rendered<P extends object> = {
//     props: P;
//     render(): RenderResult;
// };
export function isRendered(obj:any): obj is Rendered<any>{
    return obj && typeof obj.render === 'function';
}
export type GlobalConfig = {
    devMode?: boolean;
}

export type NotNull = object | number | boolean | string;

export type NumberToString = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export type ArgAt<A extends THList, I extends Nat> = UnsafeTHListGet<A, I>;

export declare type THListLengthNum<L extends THList> = any; /*{
    true: 0;
    false: Increment[THListLengthNum<THListTail<L>>];
}[THListIsTHNil<L>];*/

export type ApiFunc<A extends THList, R = void, T = never> = any /*{
    0: (this: T) => R
    1: (this: T, a0: ArgAt<A, _0>) => R
    2: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>) => R
    3: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>) => R
    4: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>) => R
    5: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>) => R
    6: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>, a5: ArgAt<A, _5>) => R
    7: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>, a5: ArgAt<A, _5>, a6: ArgAt<A, _6>) => R
    8: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>, a5: ArgAt<A, _5>, a6: ArgAt<A, _6>, a7: ArgAt<A, _7>) => R
    9: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>, a5: ArgAt<A, _5>, a6: ArgAt<A, _6>, a7: ArgAt<A, _7>, a8: ArgAt<A, _8>) => R
    10: (this: T, a0: ArgAt<A, _0>, a1: ArgAt<A, _1>, a2: ArgAt<A, _2>, a3: ArgAt<A, _3>, a4: ArgAt<A, _4>, a5: ArgAt<A, _5>, a6: ArgAt<A, _6>, a7: ArgAt<A, _7>, a8: ArgAt<A, _8>, a9: ArgAt<A, _9>) => R
}[NumberToString[THListLengthNum<A>]]*/;

export type Args<A, I = 0, L = THNil> = any; /*{
    true: Args<A, Increment[I], THCons<A[I], L>>;
    false: THListReverse<L>;
}[ObjectHasKey<A, I>]*/;

export type AnyArgs = THNil| THCons<any, THNil>;
export type NoArgs = THNil;
