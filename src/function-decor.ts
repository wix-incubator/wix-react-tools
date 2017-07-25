
export type BeforeHook<A extends Array<any>, T = any> = (this: T, methodArguments: A) => A;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type MiddlewareHook<A extends Array<any>, R = void, T = any> = (this: T, next: (methodArguments: A) => R, methodArguments: A) => R;
export type FunctionWrapper<T extends Function> = <T1 extends T>(func:T1)=>T1

export function before(){

}

export function after(){

}

export function middleware<A extends Array<any>, R = void, T = any>(hook: MiddlewareHook<A, R, T>):FunctionWrapper<(this:T, arg:A)=>R>{
    return null as any;

}
