import {AfterHook, BeforeHook, FunctionMetaData, MiddlewareHook} from "./common";
import {WrapApi, Wrapper} from "../wrappers/index";
import {funcDecorMetadataMerge, funcDecorWrapper} from "./logic";

export {
    AfterHook, BeforeHook, MiddlewareHook, FunctionMetaData
} from "./common";

export const functionDecor = new WrapApi<Partial<FunctionMetaData>, Function>('function-decor', funcDecorWrapper, funcDecorMetadataMerge);

export const cloneFunction: Wrapper<Function> = functionDecor.makeWrapper({});

export function before(preMethod: BeforeHook): Wrapper<Function> {
    return functionDecor.makeWrapper({before: [preMethod]});
}

export function after(postMethod: AfterHook<any>): Wrapper<Function> {
    return functionDecor.makeWrapper({after: [postMethod]});
}

export function middleware(hook: MiddlewareHook<any>): Wrapper<Function> {
    return functionDecor.makeWrapper({middleware: [hook]});
}

export function decorFunction(hooks: Partial<FunctionMetaData>): Wrapper<Function> {
    return functionDecor.makeWrapper(hooks);
}
