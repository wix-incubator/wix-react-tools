import {AfterHook, BeforeHook, FunctionMetaData, mergeOptionalArrays, MiddlewareHook} from "./common";
import {WrapApi, Wrapper} from "../wrappers/index";
import {funcDecorWrapper} from "./logic";

export {
    AfterHook, BeforeHook, MiddlewareHook, FunctionMetaData
} from "./common";


export class FunctionDecor extends WrapApi<Partial<FunctionMetaData>, Function> {

    static readonly instance = new FunctionDecor();

    // singleton
    private constructor() {
        if (FunctionDecor.instance) {
            return FunctionDecor.instance;
        }
        super('function-decor');
    }

    before(preMethod: BeforeHook): Wrapper<Function> {
        return this.makeWrapper({before: [preMethod]});
    }

    after(postMethod: AfterHook<any>): Wrapper<Function> {
        return this.makeWrapper({after: [postMethod]});
    }

    middleware(hook: MiddlewareHook<any>): Wrapper<Function> {
        return this.makeWrapper({middleware: [hook]});
    }

    protected mergeArgs(base: FunctionMetaData, addition: FunctionMetaData): FunctionMetaData {
        return {
            name: base.name || addition.name,
            middleware: mergeOptionalArrays(base.middleware, addition.middleware),
            before: mergeOptionalArrays(base.before, addition.before),
            after: mergeOptionalArrays(addition.after, base.after), //reverse order
        };
    }

    protected wrappingLogic<T extends Function>(target: T, args: FunctionMetaData): T {
        return funcDecorWrapper(target, args);
    }
}

export const functionDecor = FunctionDecor.instance;

export const cloneFunction: Wrapper<Function> = functionDecor.makeWrapper({});
