import {chain, concat, map} from "lodash";

export type HookWrappers = {
    middleware?: Array<Function>,
    before?: Array<Function>,
    after?: Array<Function>
}
export type FunctionWrapper = <F extends Function>(func: F) => F
export type BeforeHook<T = any> = (this: T, methodArguments: any) => any;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type MiddlewareHook<R = void, T = any> = (this: T, next: (methodArguments: any) => R, methodArguments: any) => R;






export function before(preMethod: BeforeHook): FunctionWrapper {
    return function beforeWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: any, ...methodArguments: any[]): any {
            return originalFunction.apply(this, preMethod.call(this, methodArguments));
        } as any as F;
    }
}


export function after(postMethod: AfterHook<any>): FunctionWrapper {
    return function afterWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: any, ...methodArguments: any[]): any {
            return postMethod.call(this, originalFunction.apply(this, methodArguments));
        } as any as F;
    }
}


export function middleware(hook: MiddlewareHook<any>): FunctionWrapper {
    return function middlewareWrapper<F extends Function>(originalFunction: F): F {
        return function wrapped(this: any, ...methodArguments: any[]): any {
            function next(this: any, args: any) {
                return originalFunction.apply(this, args);
            }

            return hook.apply(this, [next, methodArguments]);
        } as any as F;
    }
}

export function decorFunction(wrappers: HookWrappers) {
    return function wrapper<T extends Function>(originalMethod: T): T {
        const result : T = chain(
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
