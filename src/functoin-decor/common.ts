export type BeforeHook<T = any> = (this: T, methodArguments: any) => any;
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
export type MiddlewareHook<R = void, T = any> = (this: T, next: (methodArguments: any) => R, methodArguments: any) => R;

export type FunctionMetaData<R = any> = {
    name: string;
    middleware: MiddlewareHook<R>[] | null;
    before: BeforeHook[] | null;
    after: AfterHook<R>[] | null;
}

export function mergeOptionalArrays<T>(h1: T[] | null, h2: T[] | null): T[] | null {
    if (h1 && h1.length) {
        if (h2 && h2.length) {
            return h1.concat(h2);
        } else {
            return h1;
        }
    } else {
        return h2;
    }
}

export function isArrayLikeObject(value: any): value is Array<any> {
    return value != null && typeof value == 'object' && typeof value.length == 'number' && value.length > -1;
}
