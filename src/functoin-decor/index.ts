import {AfterHook, BeforeHook, FunctionMetaData, MiddlewareHook} from "./common";
import {WrapApi, Wrapper} from "../wrappers/index";
import {funcDecorMetadataMerge, funcDecorWrapper} from "./logic";

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
        super('function-decor', funcDecorWrapper, funcDecorMetadataMerge);
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
}

export const functionDecor = FunctionDecor.instance;

export const cloneFunction: Wrapper<Function> = functionDecor.makeWrapper({});
