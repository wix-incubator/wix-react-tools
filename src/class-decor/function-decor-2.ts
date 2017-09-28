import {AfterHook, BeforeHook, MiddlewareHook} from "../function-decor";

function _isArrayLikeObject(value: any): value is Array<any> {
    return value != null && typeof value == 'object' && typeof value.length == 'number' && value.length > -1;
}

export type MethodData = {
    middleware: MiddlewareHook[] | null;
    before: BeforeHook[] | null;
    after: AfterHook[] | null;
}

export type WrappedMethod<F extends Function = Function> = F & {
    ['$class-decor-wrapped-method']: true;
    originalMethod: F;
}

export function wrapMethod<T extends Function>(methodName: string, methodData: MethodData, originalMethod: T): WrappedMethod<T> {
    const result = function wrappedClassDecorMethod(this: T) {
        let methodArgs: any[] = Array.prototype.slice.call(arguments);
        if (methodData.before) {
            methodArgs = runBeforeHooks(this, methodData.before, methodArgs);
        }
        let methodResult;
        if (methodData.middleware && methodData.middleware.length > 0) {
            methodResult = runMiddlewareHooksAndOrigin(this, methodData.middleware, originalMethod, methodName, methodArgs);
        } else {
            methodResult = originalMethod.apply(this, methodArgs)
        }
        if (methodData.after) {
            methodResult = runAfterHooks(this, methodData.after, methodName, methodResult);
        }
        return methodResult;
    } as any as WrappedMethod<T>;
    result[wrappedFlag] = true;
    if (originalMethod) {
        result.originalMethod = originalMethod;
    }
    return result;
}


export function unwrapMethod(method: Function | WrappedMethod): Function {
    if (isWrapped(method)) {
        return method.originalMethod;
    }
    return method;
}

function isWrapped<T extends Function>(method:T): method is WrappedMethod<T>{
    return !!((method as any)[wrappedFlag]);
}
const wrappedFlag = '$class-decor-wrapped-method'; //TODO Symbol or something

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
            console.warn(`@middleware ${hooks[tracker.lastMiddlewareRunning].name} for ${context.constructor.name}.${methodName}() did not call next`);
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
