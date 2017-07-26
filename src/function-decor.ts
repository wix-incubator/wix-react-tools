export type BeforeHook<A extends Array<any>, T = any> = (this: T, methodArguments: A) => A;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type MiddlewareHook<A extends Array<any>, R = void, T = any> = (this: T, next: (methodArguments: A) => R, methodArguments: A) => R;
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

export function middleware<T extends Function>(hook: MiddlewareHook<any>): FunctionWrapper<T> {
    return function (originalFunction: Function): any {
        return function (...methodArguments: Array<any>): any {
            return hook(originalFunction as any, methodArguments);
        }
    }
}
