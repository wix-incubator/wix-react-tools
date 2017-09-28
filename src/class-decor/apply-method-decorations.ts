import {Class} from "../core/types";
import "../core/dev-mode";
import {
    inheritedMixerData,
    MixerData
} from "./mixer";
import {classPrivateState} from "../core/class-private-state";
import {AfterHook, BeforeHook, MiddlewareHook} from "../function-decor";
import {wrapMethod, unwrapMethod, MethodData} from "./function-decor-2";

declare const process: {env : {[k:string]: any}};

const edgeClassData = classPrivateState('edge class data', clazz => new EdgeClassData(clazz));

export const initEdgeClass = (clazz: Class<object>) => {
    if (!edgeClassData.hasState(clazz)) {
        edgeClassData(clazz).init();
    }
};
function notIfExists(hook: Function & { ifExists?: boolean }) {
    return !hook.ifExists;
}
function shouldCreateMethod(methodData: MethodData): boolean {
    return Boolean((methodData.before && methodData.before.some(notIfExists)) ||
        (methodData.after && methodData.after.some(notIfExists)) ||
        (methodData.middleware && methodData.middleware.some(notIfExists)));
}
export class EdgeClassData<T extends object = object> {

    private static unwrapMethod(method: Function): Function | undefined {
        return unwrapMethod(method);
    }

    constructor(private clazz: Class<T>) {
    }

    get mixerData(): MixerData<Partial<T>> {
        return inheritedMixerData.unsafe(this.clazz);
    }

    init() {
        this.mixerData.hookedMethodNames()
            .forEach((methodName: keyof T) => {
                let methodData = this.mixerData.getMethodData(methodName);
                if (methodData) {
                    // TODO check if target[methodName] === Object.getPrototypeOf(target)[methodName]
                    if (this.clazz.prototype[methodName]) {
                        this.clazz.prototype[methodName] = this.wrapMethod(methodName, methodData, EdgeClassData.unwrapMethod(this.clazz.prototype[methodName]));
                    } else if (shouldCreateMethod(methodData)) {
                        this.clazz.prototype[methodName] = this.wrapMethod(methodName, methodData, emptyMethod);
                    }
                }
            });
    }

    private wrapMethod<P extends keyof T>(methodName: P, methodData: MethodData, originalMethod: T[P]): Function {
        return wrapMethod(methodName, methodData, originalMethod);
    }
}

function emptyMethod() {
}

