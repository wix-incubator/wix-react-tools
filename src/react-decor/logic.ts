import {Attributes, cloneElement, Component, ReactElement, ReactNode, ReactType} from "react";
import {functionDecor} from "../functoin-decor/index";
import {DecorReactHooks, ElementArgs, translateArgumentsToObject, translateObjectToArguments} from "./common";
import {ReactDecor} from "./index";
import {Feature} from "../wrappers/index";
import React = require('react');

declare const process: { env: { [k: string]: any } };

type CreateElementArgsTuple<P extends {}> = [ReactType, undefined | (Attributes & Partial<P>), ReactNode];

interface HookContext<T extends object> {
    componentInstance: undefined | Component<T>
    hooks: DecorReactHooks<T>;
    componentProps: T;
    createArgsMap: Map<object, ElementArgs<any>>;
}

const originalReactCreateElement: typeof React.createElement = React.createElement;
const originalReactCloneElement: typeof React.cloneElement = React.cloneElement;

export function resetReactMonkeyPatches() {
    (React as any).createElement = originalReactCreateElement;
    (React as any).cloneElement = originalReactCloneElement;
}

const emptyObj = Object.freeze({});
const context = {
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

export const wrappedCreateElement = functionDecor.makeFeature({
    before: [applyHooksOnArguments],
    after: [saveCreateElementArguments]
})(originalReactCreateElement);


export const wrappedReactCloneElement = functionDecor.makeFeature({
    before: [],
    after: []
})(originalReactCloneElement);

export function makeRenderFeature(reactDecor: ReactDecor): Feature<Function> {
    function beforeRender(this: any, args: [object, any], wrappedRender: Function): [object, any] {
        if (React.createElement !== wrappedCreateElement) {
            const isClass = this && this.render === wrappedRender;
            const wrapperArgs = reactDecor.getDecoration(isClass ? this.constructor : wrappedRender);
            if (wrapperArgs) {
                context.componentInstance = this;
                context.createArgsMap.clear();
                context.hooks = isClass ? wrapperArgs.classHooks : wrapperArgs.statelessHooks;
                context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
                React.createElement = wrappedCreateElement;
                React.cloneElement = wrappedReactCloneElement;
            } else {
                throw new Error('how comes no decoration?');
            }
        }
        return args;
    }

    function afterRender<P extends {}>(this: any, renderResult: ReactElement<P>): ReactElement<P> {
        if (renderResult && context.hooks) {
            let rootElementArgs = context.createArgsMap.get(renderResult);
            if (rootElementArgs) {
                for (let i = 0; i < context.hooks.length; i++) {
                    rootElementArgs = context.hooks[i].call(context.componentInstance, context.componentProps, rootElementArgs, true);
                }
                renderResult = cloneElement(renderResult, (rootElementArgs!).elementProps, ...rootElementArgs!.children);
                context.createArgsMap.set(renderResult, rootElementArgs!);
            } else if (process.env.NODE_ENV !== 'production') {
                console.warn('unexpected root node : ', renderResult);
            }
        }
        resetReactMonkeyPatches();
        return renderResult;
    }

    return functionDecor.makeFeature({
        before: [beforeRender],
        after: [afterRender]
    });
}

