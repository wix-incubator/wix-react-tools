import {Class} from "../core/types";
import "../core/dev-mode";
import {
    inheritedMixerData,
    MixerData
} from "./mixer";
import {classPrivateState} from "../core/class-private-state";
import {innerDecorateFunction} from "../functoin-decor/decorate";
import {functionDecorMetadata, FunctionHooks} from "../functoin-decor";

declare const process: { env: { [k: string]: any } };

const edgeClassData = classPrivateState('edge class data', clazz => new EdgeClassData(clazz));

export const initEdgeClass = (clazz: Class<object>) => {
    if (!edgeClassData.hasState(clazz)) {
        edgeClassData(clazz).init();
    }
};

function notIfExists(hook: Function & { ifExists?: boolean }) {
    return !hook.ifExists;
}

function shouldCreateMethod(hooks: FunctionHooks): boolean {
    return Boolean((hooks.before && hooks.before.some(notIfExists)) ||
        (hooks.after && hooks.after.some(notIfExists)) ||
        (hooks.middleware && hooks.middleware.some(notIfExists)));
}

export function unwrapFunction(func: Function): Function {
    const functionMetaData = functionDecorMetadata(func);
    return (functionMetaData) ? functionMetaData.original : func;
}

export class EdgeClassData<T extends object = object> {

    mixerData: MixerData<Partial<T>> = inheritedMixerData.unsafe(this.clazz);

    constructor(private clazz: Class<T>) {
    }

    init() {
        this.mixerData.hookedMethodNames()
            .forEach((methodName: keyof T) => {
                let methodData = this.mixerData.getMethodHooks(methodName);
                if (methodData) {
                    // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
                    if (this.clazz.prototype[methodName]) {
                        this.clazz.prototype[methodName] = innerDecorateFunction(methodData.before, methodData.middleware, methodData.after, unwrapFunction(this.clazz.prototype[methodName]), methodName);
                    } else if (shouldCreateMethod(methodData)) {
                        this.clazz.prototype[methodName] = innerDecorateFunction(methodData.before, methodData.middleware, methodData.after, emptyMethod, methodName);
                    }
                }
            });
    }
}

function emptyMethod() {
}

