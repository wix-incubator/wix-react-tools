import {Attributes, Component, ReactElement, ReactNode, ReactType} from "react";
import {functionDecor} from "../functoin-decor/index";
import {
    DecorReactHooks,
    ElementArgs,
    originalReactCreateElement,
    translateArgumentsToObject,
    translateObjectToArguments
} from "./common";

declare const process: { env: { [k: string]: any } };

export type CreateElementArgsTuple<P extends {}> = [ReactType, undefined | (Attributes & Partial<P>), ReactNode];

export interface HookContext<T extends object> {
    componentInstance: undefined | Component<T>
    hooks: DecorReactHooks<T>;
    componentProps: T;
    createArgsMap: Map<object, ElementArgs<any>>;
}

const emptyObj = Object.freeze({});
export const context = {
    componentInstance: undefined,
    hooks: emptyObj,
    componentProps: emptyObj,
    createArgsMap: new Map()
} as HookContext<object>; // componentProps will be overwritten before render

let createElementArgsObject: ElementArgs<any>;

const applyHooksOnArguments = (createElementArgsTuple: CreateElementArgsTuple<any>): CreateElementArgsTuple<any> => {
    createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
    if (context.hooks) {
        for (let i = 0; i < context.hooks.length; i++) {
            const hook = context.hooks[i];
            if (!hook.rootOnly) {
                createElementArgsObject = hook.call(context.componentInstance, context.componentProps, createElementArgsObject, false);
            }
        }
        return translateObjectToArguments(createElementArgsObject);
    }
    return createElementArgsTuple;
};

const saveCreateElementArguments = (createElementResult: ReactElement<any>): ReactElement<any> => {
    if (createElementResult) {
        context.createArgsMap.set(createElementResult, createElementArgsObject);
    }
    return createElementResult;
};

export const wrappedCreateElement = functionDecor.makeWrapper({
    before: [applyHooksOnArguments],
    after: [saveCreateElementArguments]
})(originalReactCreateElement);
