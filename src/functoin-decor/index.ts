import {
    AfterHook, BeforeHook, FunctionHooks,
    MiddlewareHook
} from "./common";
import {Wrapper, WrapApi} from "../wrappers/index";
import {funcDecorMetadataMerge, funcDecorWrapper, FunctionMetaData} from "./wrapper";

export  {
    AfterHook, BeforeHook, FunctionHooks, MiddlewareHook
} from "./common";

export const functionDecor = new WrapApi<Partial<FunctionMetaData>, Function>('function-decor', funcDecorWrapper, funcDecorMetadataMerge);

export function before(preMethod: BeforeHook): Wrapper<Function> {
    return functionDecor.makeWrapper({before:[preMethod]});
}

export function after(postMethod: AfterHook<any>): Wrapper<Function> {
    return functionDecor.makeWrapper({after:[postMethod]});
}

export function middleware(hook: MiddlewareHook<any>): Wrapper<Function> {
    return functionDecor.makeWrapper({middleware:[hook]});
}

export function decorFunction(hooks: Partial<FunctionHooks>): Wrapper<Function> {
    return functionDecor.makeWrapper(hooks);
}
