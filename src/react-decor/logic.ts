import {Attributes, Component, HTMLAttributes, ReactElement, ReactNode, ReactType} from "react";
import {functionDecor} from "../functoin-decor/index";
import {DecorReactHooks, Element, ElementArgs, ElementType} from "./common";
import {ReactDecor} from "./index";
import {Feature} from "../wrappers/feature-manager";
import React = require('react');

declare const process: { env: { [k: string]: any } };

type CreateElementArgsTuple<P extends {}> = [ReactType, undefined | (Attributes & Partial<P>), ReactNode];
type CloneElementArgsTuple<P extends {}> = [Element<Partial<P>>, undefined | (Attributes & Partial<P>), ReactNode];

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

let currentElementArgs: ElementArgs<any>;

type CrerateElementArgsTuple<P extends HTMLAttributes<HTMLElement>> = [ElementType<P>, undefined | (Attributes & Partial<P>), ReactNode]

function translateObjectToCloneElementArguments<P extends {}>(args: ElementArgs<P>): CloneElementArgsTuple<P> {
    return [args.originalElement!, args.newProps, ...args.children] as CloneElementArgsTuple<P>;
}

function translateCloneElementArgumentsToObject<P extends {}>(args: CloneElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0].type,
        newProps: args[1] || {},
        originalElement: args[0],
        children: args.length > 2 ? Array.prototype.slice.call(args, 2) : []
    };
}

function translateCreateElementArgumentsToObject<P extends {}>(args: CrerateElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0],
        newProps: args[1] || {},
        children: args.length > 2 ? Array.prototype.slice.call(args, 2) : []
    };
}

function translateObjectToCrerateElementArguments<P extends {}>(args: ElementArgs<P>): CrerateElementArgsTuple<P> {
    return [args.type, args.newProps, ...args.children] as CrerateElementArgsTuple<P>;
}

function applyHooksOnCrerateElementArguments(argsTuple: CreateElementArgsTuple<any>): CreateElementArgsTuple<any> {
    if (context.hooks) {
        currentElementArgs = translateCreateElementArgumentsToObject(argsTuple);
        for (let i = 0; i < context.hooks.length; i++) {
            const hook = context.hooks[i];
            if (!hook.rootOnly) {
                currentElementArgs = hook.call(context.componentInstance, context.componentProps, currentElementArgs, false) || currentElementArgs;
            }
        }
        return translateObjectToCrerateElementArguments(currentElementArgs);
    }
    return argsTuple;
}

const applyHooksOnCloneElementArguments = (argsTuple: CloneElementArgsTuple<any>): CloneElementArgsTuple<any> => {
    if (context.hooks) {
        currentElementArgs = translateCloneElementArgumentsToObject(argsTuple);
        for (let i = 0; i < context.hooks.length; i++) {
            const hook = context.hooks[i];
            if (!hook.rootOnly) {
                currentElementArgs = hook.call(context.componentInstance, context.componentProps, currentElementArgs, false) || currentElementArgs;
            }
        }
        return translateObjectToCloneElementArguments(currentElementArgs);
    }
    return argsTuple;
};

const saveCurrentElementArgs = (newElement: ReactElement<any>): ReactElement<any> => {
    if (newElement) {
        context.createArgsMap.set(newElement, currentElementArgs);
    }
    return newElement;
};

export const wrappedCreateElement = functionDecor.makeFeature({
    before: [applyHooksOnCrerateElementArguments],
    after: [saveCurrentElementArgs]
})(originalReactCreateElement);

export const wrappedReactCloneElement = functionDecor.makeFeature({
    before: [applyHooksOnCloneElementArguments],
    after: [saveCurrentElementArgs]
})(originalReactCloneElement);

export function makeRenderFeature(reactDecor: ReactDecor): Feature<Function> {
    function beforeRender(this: any, args: [object, any], wrappedRender: Function): [object, any] {
        if (React.createElement !== wrappedCreateElement) {
            const isClass = this && this.constructor && reactDecor.isDecorated(this.constructor);
            const decorated: React.ComponentType = (isClass) ? this.constructor : wrappedRender;
            const wrapperArgs = reactDecor.getDecoration(decorated);
            if (wrapperArgs) {
                context.componentInstance = this;
                context.createArgsMap.clear();
                context.hooks = isClass ? wrapperArgs.classHooks : wrapperArgs.statelessHooks;
                context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
                React.createElement = wrappedCreateElement;
                React.cloneElement = wrappedReactCloneElement;
            } else {
                throw new Error(`Cannot extract decoration information during render of '${decorated.displayName || decorated.name || decorated}'`);
            }
        }
        return args;
    }

    function afterRender<P extends {}>(this: any, renderResult: ReactElement<P>): ReactElement<P> {
        if (renderResult && context.hooks) {
            let rootElementArgs = context.createArgsMap.get(renderResult);
            if (rootElementArgs) {
                for (let i = 0; i < context.hooks.length; i++) {
                    rootElementArgs = (context.hooks[i].call(context.componentInstance, context.componentProps, rootElementArgs, true) || rootElementArgs) as ElementArgs<any>;
                }
                renderResult = originalReactCreateElement(renderResult.type as any, Object.assign({}, renderResult.props, rootElementArgs.newProps), ...rootElementArgs.children);
                // please un-comment only when using cloneElement is justified by tests
                // renderResult = originalReactCloneElement(renderResult, rootElementArgs.newProps, ...rootElementArgs.children);
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

