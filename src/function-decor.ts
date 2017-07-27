import {ApiFunc} from "./core/types";
import {Increment, ObjectHasKey, THCons, THList, THListReverse, THListToTuple, THNil} from "typelevel-ts";
export type BeforeHook<A extends Array<any>, T = any> = (this: T, methodArguments: A) => A;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type FunctionWrapper<T extends Function> = <T1 extends T>(func: T1) => T1

export function before<T extends Function>(preMethod: BeforeHook<any>): FunctionWrapper<T> {
    return function (originalFunction: Function): any {
        return function (...methodArguments: Array<any>): any {
            return originalFunction(...preMethod(methodArguments));
        }
    }
}

export function after<T extends Function>(postMethod: AfterHook<any>): FunctionWrapper<T> {
    return function (originalFunction: Function): any {
        return function (methodResult: any) {
            return postMethod(originalFunction(methodResult));
        }
    }
}

export type _FunctionWrapper<A, R = void, T = any, I = 0, L = THNil> =  {
    true: _FunctionWrapper<A, R, T, Increment[I], THCons<A[I], L>>;
    false: (func: ApiFunc<THListReverse<L>, R, T>) => ApiFunc<THListReverse<L>, R, T>
}[ObjectHasKey<A, I>];


export type MiddlewareHook<A extends THList, R = void, T = any> = (this: T, next: (methodArguments: THListToTuple<A>) => R, methodArguments: THListToTuple<A>) => R;

export function middleware<A extends THList, R=void, T=any>(hook: MiddlewareHook<A, R, T>) {
    return function middlewareWrapper<F extends ApiFunc<A, R, T>>(originalFunction: F): F {
        return function wrapped(this:T, ...methodArguments: any[]): R {
            function next(this:T, args: THListToTuple<A>){
                return originalFunction.apply(this, args);
            }
            return hook.apply(this, [next, methodArguments]);
        } as any as F;
    }
}
