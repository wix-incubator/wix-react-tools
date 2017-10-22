import {FunctionMetaData, isArrayLikeObject, mergeOptionalArrays, MiddlewareHook} from "./common";

export function funcDecorMetadataMerge(md1: FunctionMetaData, md2: FunctionMetaData): FunctionMetaData {
    return {
        name: md1.name || md2.name,
        middleware: mergeOptionalArrays(md1.middleware, md2.middleware),
        before: mergeOptionalArrays(md1.before, md2.before),
        after: mergeOptionalArrays(md2.after, md1.after),
    };
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

function createNextForMiddlewareHook(context: any, originalFunction: Function, middlewareHooks: Array<MiddlewareHook>, idx: number, tracker: MiddlewareTracker, wrappedFunction: Function) {
    return (args: any[]) => {
        tracker.reportNextMiddleware(idx);
        return middlewareHooks.length <= idx ?
            (originalFunction && originalFunction.apply(context, args)) :
            middlewareHooks[idx].call(context, createNextForMiddlewareHook(context, originalFunction, middlewareHooks, idx + 1, tracker, wrappedFunction), args, wrappedFunction);
    };
}

export function funcDecorWrapper<T extends Function>(target: T, args: FunctionMetaData): T {
    if (!args.name && target.name){
        args.name = target.name;
    }
    const wrappedFunction = function wrappedFunction(this: any) {
        let methodArgs: any[] = Array.prototype.slice.call(arguments);
        if (args.before) {
            for (let i = 0; i < args.before.length; i++) {
                methodArgs = args.before[i].call(this, methodArgs, wrappedFunction);
                if (!isArrayLikeObject(methodArgs)) {
                    errorBeforeDidNotReturnedArray(methodArgs);
                }
            }
        }
        let methodResult;
        if (args.middleware) {
            //keep track of last middleware running by ID to determine chain breakage:
            const tracker = (process.env.NODE_ENV === 'production') ? dummyTracker : new MiddlewareTracker();
            //Run middleware:
            const next = createNextForMiddlewareHook(this, target, args.middleware, 1, tracker, wrappedFunction);
            methodResult = args.middleware[0].call(this, next, methodArgs, wrappedFunction);
            if (process.env.NODE_ENV !== 'production') {
                if (tracker.lastMiddlewareRunning < args.middleware.length) {
                    if (context) {
                        console.warn(`@middleware ${args.middleware[tracker.lastMiddlewareRunning].name} for ${context.constructor.name}.${args.name}() did not call next`);
                    } else {
                        console.warn(`@middleware ${args.middleware[tracker.lastMiddlewareRunning].name} for ${args.name}() did not call next`);
                    }
                }
            }
        } else {
            methodResult = target.apply(this, methodArgs)
        }
        if (args.after) {
            for (let i = 0; i < args.after.length; i++) {
                const hookMethodResult = args.after[i].call(this, methodResult, wrappedFunction);
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
    for (let k in target) {
        wrappedFunction[k] = target[k];
    }
    return wrappedFunction;
}
