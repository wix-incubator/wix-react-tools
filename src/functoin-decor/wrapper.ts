import {FunctionHooks, MiddlewareHook} from "./common";

export type FunctionMetaData = FunctionHooks & {
    name: string;
}

function mergeOptionalArrays<T>(h1: T[] | null, h2: T[] | null): T[] | null {
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

export function funcDecorMetadataMerge(md1: FunctionMetaData, md2: FunctionMetaData): FunctionMetaData {
    return {
        name: md1.name || md2.name,
        middleware: mergeOptionalArrays(md1.middleware, md2.middleware),
        before: mergeOptionalArrays(md1.before, md2.before),
        after: mergeOptionalArrays(md1.after, md2.after),
    };
}

function isArrayLikeObject(value: any): value is Array<any> {
    return value != null && typeof value == 'object' && typeof value.length == 'number' && value.length > -1;
}

function errorBeforeDidNotReturnedArray(methodArgs: any[]) {
    let serialized = '(unSerializable)';
    try {
        serialized = JSON.stringify(methodArgs)
    } catch (e) {
    }
    throw new Error('before hook did not return an array-like object: ' + serialized)
}


class MiddlewareTracker {
    lastMiddlewareRunning = 0;

    reportNextMiddleware(index: number) {
        this.lastMiddlewareRunning = Math.max(index, this.lastMiddlewareRunning);
    };
}

// to simplify code, use this instead of an active tracker
const dummyTracker = {
    lastMiddlewareRunning: Number.MAX_VALUE,
    reportNextMiddleware(index: number) {
    }
};

function runMiddlewareHooksAndOrigin(context: any, hooks: Array<MiddlewareHook>, originalMethod: Function, methodName: string, methodArgs: any[]) {
    //keep track of last middleware running by ID to determine chain breakage:
    let tracker: MiddlewareTracker = (process.env.NODE_ENV === 'production') ? dummyTracker : new MiddlewareTracker();
    //Run middleware:
    const retVal = hooks[0].call(context, createNextForMiddlewareHook(context, originalMethod, hooks, 1, tracker), methodArgs);
    if (process.env.NODE_ENV !== 'production') {
        if (tracker.lastMiddlewareRunning < hooks.length) {
            if (context) {
                console.warn(`@middleware ${hooks[tracker.lastMiddlewareRunning].name} for ${context.constructor.name}.${methodName}() did not call next`);
            } else {
                console.warn(`@middleware ${hooks[tracker.lastMiddlewareRunning].name} for ${methodName}() did not call next`);
            }
        }
    }
    return retVal;
}

function createNextForMiddlewareHook(context: any, originalMethod: Function, middlewareHooks: Array<MiddlewareHook>, idx: number, tracker: MiddlewareTracker) {
    return (args: any[]) => {
        tracker.reportNextMiddleware(idx);
        return middlewareHooks.length <= idx ?
            (originalMethod && originalMethod.apply(context, args)) :
            middlewareHooks[idx].call(context, createNextForMiddlewareHook(context, originalMethod, middlewareHooks, idx + 1, tracker), args as any);
    };
}

export function funcDecorWrapper<T extends Function>(target: T, args: FunctionMetaData): T {
    const wrappedFunction = function wrappedFunction(this: any) {
        let methodArgs: any[] = Array.prototype.slice.call(arguments);
        if (args.before) {
            for (let i = 0; i < args.before.length; i++) {
                methodArgs = args.before[i].call(this, methodArgs);
                if (!isArrayLikeObject(methodArgs)) {
                    errorBeforeDidNotReturnedArray(methodArgs);
                }
            }
        }
        let methodResult;
        if (args.middleware) {
            methodResult = runMiddlewareHooksAndOrigin(this, args.middleware, target, args.name, methodArgs);
        } else {
            methodResult = target.apply(this, methodArgs)
        }
        if (args.after) {
            for (let i = 0; i < args.after.length; i++) {
                const hookMethodResult = args.after[i].call(this, methodResult);
                if (process.env.NODE_ENV !== 'production') {
                    if (methodResult !== undefined && hookMethodResult === undefined) {
                        console.warn(`@after ${args.name} Did you forget to return a value?`);
                    }
                }
                methodResult = hookMethodResult;
            }
        }
        return methodResult;
    } as Function as T;
    for (let k in target){
        wrappedFunction[k] = target[k];
    }
    return wrappedFunction;
}
