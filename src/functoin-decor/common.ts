


export type BeforeHook<T = any> = (this: T, methodArguments: any) => any;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type MiddlewareHook<R = void, T = any> = (this: T, next: (methodArguments: any) => R, methodArguments: any) => R;


export type FunctionHooks<R = any> = {
    middleware: MiddlewareHook<R>[] | null;
    before: BeforeHook[] | null;
    after: AfterHook<R>[] | null;
}
