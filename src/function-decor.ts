import {ApiFunc} from "./core/types";
import { THList, THListToTuple} from "typelevel-ts";
import { chain, concat, map } from "lodash";

export type FunctionWrapper<A extends THList, R = void, T = any> =  <F extends ApiFunc<A, R, T>>(func: F) => F

export type BeforeHook<A extends THList, T = any> = (this: T, methodArguments: THListToTuple<A>) => THListToTuple<A>;

export function before<A extends THList, T=any>(preMethod: BeforeHook<A, T>): FunctionWrapper<A, any, T> {
    return function beforeWrapper<F extends ApiFunc<A, any, T>>(originalFunction: F): F {
        return function wrapped(this:T, ...methodArguments:any[]): any {
            return originalFunction.apply(this, preMethod.call(this, methodArguments));
        } as any as F;
    }
}

export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;

export function after<R=void, T=any>(postMethod: AfterHook<R, T>): FunctionWrapper<any, R, T> {
    return function afterWrapper<F extends ApiFunc<any, R, T>>(originalFunction: F): F {
        return function wrapped(this:T, ...methodArguments:any[]): R {
            return postMethod.call(this, originalFunction.apply(this, methodArguments));
        } as any as F;
    }
}

export type MiddlewareHook<A extends THList, R = void, T = any> = (this: T, next: (methodArguments: THListToTuple<A>) => R, methodArguments: THListToTuple<A>) => R;

export function middleware<A extends THList, R=void, T=any>(hook: MiddlewareHook<A, R, T>): FunctionWrapper<A, R, T> {
    return function middlewareWrapper<F extends ApiFunc<A, R, T>>(originalFunction: F): F {
        return function wrapped(this:T, ...methodArguments: any[]): R {
            function next(this:T, args: THListToTuple<A>){
                return originalFunction.apply(this, args);
            }
            return hook.apply(this, [next, methodArguments]);
        } as any as F;
    }
}

export type HookWrappers = {
    middleware?: Array<Function>,
    before?: Array<Function>,
    after?: Array<Function>
}

export function decorFunction<T extends Function>(wrappers: HookWrappers) {
    return function wrapper<T1 extends T>(originalMethod: T1): T1 {
        return chain(
        concat(
            map(wrappers.middleware, (mw:any) => middleware(mw)),
            map(wrappers.before, (b:any) => before(b)),
            map(wrappers.after, (a:any) => after(a))
    )).reduce((prev:Function, wrapper:Function) => wrapper(prev), originalMethod).value();
}}
