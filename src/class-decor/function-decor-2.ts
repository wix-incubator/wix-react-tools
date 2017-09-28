import {AfterHook, BeforeHook, MiddlewareHook} from "../function-decor";
import {privateState} from "../core/private-state";


function _isArrayLikeObject(value: any): value is Array<any> {
    return value != null && typeof value == 'object' && typeof value.length == 'number' && value.length > -1;
}

export type FunctionHooks = {
    middleware: MiddlewareHook[] | null;
    before: BeforeHook[] | null;
    after: AfterHook[] | null;
}

export type FunctionMetaData = FunctionHooks & {
    original: Function;
}

const metadata = privateState<FunctionMetaData, Function>('function-decor-metadata', () => ({
    original: null as any,
    middleware: null,
    before: null,
    after: null,
}));

export function decorateFunction<T extends Function>(toWrap: T, beforeHooks: BeforeHook[] | null, middlewareHooks: MiddlewareHook[] | null, afterHooks: AfterHook[] | null, functionName?:string): T {
    const wrappedFunction = function wrappedFunction(this: any) {
        let methodArgs: any[] = Array.prototype.slice.call(arguments);
        if (beforeHooks) {
            methodArgs = runBeforeHooks(this, beforeHooks, methodArgs);
        }
        let methodResult;
        if (middlewareHooks) {
            methodResult = runMiddlewareHooksAndOrigin(this, middlewareHooks, toWrap, functionName || toWrap.name, methodArgs);
        } else {
            methodResult = toWrap.apply(this, methodArgs)
        }
        if (afterHooks) {
            methodResult = runAfterHooks(this, afterHooks, functionName || toWrap.name, methodResult);
        }
        return methodResult;
    } as Function as T;

    const functionMetaData = metadata(wrappedFunction);
    functionMetaData.original = toWrap;
    functionMetaData.middleware = middlewareHooks;
    functionMetaData.before = beforeHooks;
    functionMetaData.after = afterHooks;
    return wrappedFunction;
}

export function unwrapMethod(method: Function): Function {
    return (metadata.hasState(method)) ? metadata(method).original : method;
}

function errorBeforeDidNotReturnedArray(methodArgs: any[]) {
    let serialized = '(unSerializable)';
    try {
        serialized = JSON.stringify(methodArgs)
    } catch (e) {
    }
    throw new Error('before hook did not return an array-like object: ' + serialized)
}

function runBeforeHooks(context: any, hooks: Array<BeforeHook>, methodArgs: any[]) {
    hooks.forEach((hook: BeforeHook) => {
        methodArgs = hook.call(context, methodArgs);
        if (!_isArrayLikeObject(methodArgs)) {
            errorBeforeDidNotReturnedArray(methodArgs);
        }
    });
    return methodArgs;
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

function runAfterHooks(context: any, hooks: Array<AfterHook>, methodName: string, methodResult: any) {
    hooks.forEach((hook: AfterHook) => {
        const hookMethodResult = hook.call(context, methodResult);
        if (process.env.NODE_ENV !== 'production') {
            if (methodResult !== undefined && hookMethodResult === undefined) {
                console.warn(`@after ${methodName} Did you forget to return a value?`);
            }
        }
        methodResult = hookMethodResult;
    });
    return methodResult;
}
