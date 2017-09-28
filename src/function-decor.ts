import {chain, concat, map} from "lodash";

export type FunctionWrapper<R = void, T = any> = <F extends Function>(func: F) => F

export type BeforeHook<T = any> = (this: T, methodArguments: any) => any;

export function before<T = any>(preMethod: BeforeHook<T>): FunctionWrapper<any, T> {
    return function beforeWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: T, ...methodArguments: any[]): any {
            return originalFunction.apply(this, preMethod.call(this, methodArguments));
        } as any as F;
    }
}

export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;

export function after<R=void, T=any>(postMethod: AfterHook<R, T>): FunctionWrapper<R, T> {
    return function afterWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: T, ...methodArguments: any[]): R {
            return postMethod.call(this, originalFunction.apply(this, methodArguments));
        } as any as F;
    }
}

export type MiddlewareHook<R = void, T = any> = (this: T, next: (methodArguments: any) => R, methodArguments: any) => R;

export function middleware<R=void, T=any>(hook: MiddlewareHook<R, T>): FunctionWrapper<R, T> {
    return function middlewareWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: T, ...methodArguments: any[]): R {
            function next(this: T, args: any) {
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
        const result : T1 = chain(
            concat(
                map(wrappers.middleware, (mw: any) => middleware(mw)),
                map(wrappers.before, (b: any) => before(b)),
                map(wrappers.after, (a: any) => after(a))
            )).reduce((prev: Function, wrapper: Function) => wrapper(prev), originalMethod).value();
        for (let k in originalMethod){
            result[k] = originalMethod[k];
        }
        return result;
    }
}
