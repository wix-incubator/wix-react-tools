import {Class} from "../../core/types";
import "../../core/dev-mode";
import {inheritedMixerData, MixerData} from "./mixer";
import {classPrivateState} from "../../core/class-private-state";
import {functionDecor, FunctionMetaData} from "../../functoin-decor";

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

function shouldCreateMethod(hooks: FunctionMetaData): boolean {
    return Boolean((hooks.before && hooks.before.some(notIfExists)) ||
        (hooks.after && hooks.after.some(notIfExists)) ||
        (hooks.middleware && hooks.middleware.some(notIfExists)));
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
                        this.clazz.prototype[methodName] = functionDecor.wrap(methodData, [], functionDecor.normalize(this.clazz.prototype[methodName]));
                    } else if (shouldCreateMethod(methodData)) {
                        this.clazz.prototype[methodName] = functionDecor.wrap(methodData, [], emptyMethod);
                    }
                }
            });
    }
}

function emptyMethod() {
}

