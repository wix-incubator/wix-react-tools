


import {AfterHook, BeforeHook, FunctionHooks, MiddlewareHook} from "./common";
import {privateState, StateProvider} from "../core/private-state";

export type FunctionMetaData = FunctionHooks & {
    original: Function;
    name: string;
}

const internalMetadata = privateState<FunctionMetaData, Function>('function-decor-metadata', () => ({
    original: null as any,
    name: null as any,
    middleware: null,
    before: null,
    after: null,
}));

export const functionDecorMetadata = function(func: Function){
    return (internalMetadata.hasState(func)) ? internalMetadata(func) : null;
} as StateProvider<FunctionMetaData | null, Function>;
functionDecorMetadata.hasState = internalMetadata.hasState;
functionDecorMetadata.unsafe = internalMetadata.unsafe;


export function setMetadata<T extends Function>(wrappedFunction: T, functionName: string, toWrap: T, middlewareHooks: MiddlewareHook[] | any, beforeHooks: BeforeHook[] | any, afterHooks: AfterHook[] | any) {
    const functionMetaData = internalMetadata(wrappedFunction);
    functionMetaData.name = functionName;
    functionMetaData.original = toWrap;
    functionMetaData.middleware = middlewareHooks;
    functionMetaData.before = beforeHooks;
    functionMetaData.after = afterHooks;
}
