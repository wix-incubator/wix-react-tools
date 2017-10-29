import {AfterHook, BeforeHook, FunctionMetaData, mergeOptionalArrays, MiddlewareHook} from "./common";
import {DecorApi, Feature} from "../wrappers/index";
import {funcDecorWrapper} from "./logic";

export {
    AfterHook, BeforeHook, MiddlewareHook, FunctionMetaData
} from "./common";


export class FunctionDecor extends DecorApi<Partial<FunctionMetaData>, Function> {

    static readonly instance = new FunctionDecor();

    // singleton
    private constructor() {
        if (FunctionDecor.instance) {
            return FunctionDecor.instance;
        }
        super('function-decor');
    }

    before(preMethod: BeforeHook): Feature<Function> {
        return this.makeFeature({before: [preMethod]});
    }

    after(postMethod: AfterHook<any>): Feature<Function> {
        return this.makeFeature({after: [postMethod]});
    }

    middleware(hook: MiddlewareHook<any>): Feature<Function> {
        return this.makeFeature({middleware: [hook]});
    }

    protected mergeDecorations(base: FunctionMetaData, addition: FunctionMetaData): FunctionMetaData {
        return {
            name: base.name || addition.name,
            middleware: mergeOptionalArrays(addition.middleware, base.middleware),
            before: mergeOptionalArrays(addition.before, base.before),
            after: mergeOptionalArrays(base.after, addition.after), //reverse order
        };
    }

    protected decorationLogic<T extends Function>(target: T, args: FunctionMetaData): T {
        return funcDecorWrapper(target, args);
    }
}

export const functionDecor = FunctionDecor.instance;

export const cloneFunction: Feature<Function> = functionDecor.makeFeature({});
