import {innerDecorateFunction} from "./decorate";

import {
    AfterHook, BeforeHook, FunctionHooks,
    MiddlewareHook
} from "./common";

export  {
    AfterHook, BeforeHook, FunctionHooks, MiddlewareHook
} from "./common";
export {functionDecorMetadata} from "./reflection"

export type FunctionWrapper = <F extends Function>(func: F) => F

export function before(preMethod: BeforeHook): FunctionWrapper {
    return innerDecorateFunction.bind(null, [preMethod], null, null);
}

export function after(postMethod: AfterHook<any>): FunctionWrapper {
    return innerDecorateFunction.bind(null, null, null, [postMethod]);
}

export function middleware(hook: MiddlewareHook<any>): FunctionWrapper {
    return innerDecorateFunction.bind(null, null, [hook], null);
}

export function decorFunction(wrappers: Partial<FunctionHooks>): FunctionWrapper {
    return innerDecorateFunction.bind(null, wrappers.before || null, wrappers.middleware || null, wrappers.after || null);
}
