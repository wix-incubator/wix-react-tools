import React = require('react');
import {Attributes, cloneElement, ReactElement, ReactNode, ReactType, SFC} from "react";
import {decorFunction, middleware} from "../function-decor";
import {DecorReactHooks, ElementArgs, ElementHook, isNotEmptyArrayLike} from "./common";
import {getGlobalConfig} from "../core/config";
import {GlobalConfig} from "../core/types";

export type CreateElementArgsTuple<P extends {}> = [ReactType, undefined | (Attributes & Partial<P>), ReactNode];
export type SFCDecorator<T extends object> = <T1 extends T>(comp: SFC<T1>) => SFC<T1>;
export interface HookContext<T extends object> {
    hooks: DecorReactHooks<T>;
    componentProps: T;
    createArgsMap: Map<object, ElementArgs<any>>;
}

type ReactCreateElement = typeof React.createElement;
const originalCreateElement = React.createElement;

function getHooksReducer<T extends object>(componentProps: T) {
    return <P extends {}>(res: ElementArgs<P>, hook: ElementHook<T>) => hook(null, componentProps, res);
}

const translateName = middleware((next:(args:[React.SFC])=>React.SFC, args:[React.SFC]) => {
    const result : React.SFC = next(args);
    if (!result.displayName && args[0].name){
        result.displayName = args[0].name;
    }
    return result;
});

export function decorReactFunc<T extends {}>(hooks: DecorReactHooks<T>): SFCDecorator<T> {
    const context = {
        hooks,
        componentProps: {} as T,
        createArgsMap: new Map()
    } as HookContext<T>; // componentProps will be overwritten before render
    const wrappedCreateElement = makeCustomCreateElement(context);

    const replaceCreateElement = (args: [T, any]): [T, any] => {
        context.componentProps = args[0]; // [0] for props in a functional react component
        React.createElement = wrappedCreateElement;
        return args;
    };

    const applyRootHooks = <P extends {}>(renderResult: ReactElement<P>): ReactElement<P> => {
        if (renderResult && isNotEmptyArrayLike(hooks.onRootElement)) {
            let rootElementArgs = context.createArgsMap.get(renderResult);

            if (rootElementArgs) {
                rootElementArgs = hooks.onRootElement.reduce(getHooksReducer(context.componentProps), rootElementArgs);
                renderResult = cloneElement(renderResult, (rootElementArgs!).elementProps);
            } else if (getGlobalConfig<GlobalConfig>().devMode) {
                console.warn('unexpected root node : ', renderResult);
            }
        }
        context.createArgsMap.clear();
        React.createElement = originalCreateElement as ReactCreateElement;
        return renderResult;
    };

    const decorator = decorFunction({
        before: [replaceCreateElement],
        after: [applyRootHooks]
    });

    return getGlobalConfig().devMode ? translateName(decorator) : decorator;
}

// create a custom react create element function that applies the given hooks
function makeCustomCreateElement<P extends {}>(context: HookContext<P>): typeof React.createElement {
    let createElementArgsObject: ElementArgs<P>;

    const applyHooksOnArguments = (createElementArgsTuple: CreateElementArgsTuple<P>): CreateElementArgsTuple<P> => {
        createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
        if (isNotEmptyArrayLike(context.hooks.onEachElement)) {
            createElementArgsObject = context.hooks.onEachElement.reduce(getHooksReducer(context.componentProps), createElementArgsObject);
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

    return decorFunction({
        before: [applyHooksOnArguments],
        after: [saveCreateElementArguments]
    })(originalCreateElement);
}

function translateArgumentsToObject<P extends {}>(args: CreateElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0],
        elementProps: args[1] || {},
        children: Array.prototype.slice.call(args, 2)
    };
}

function translateObjectToArguments<P extends {}>(args: ElementArgs<P>): CreateElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as CreateElementArgsTuple<P>;
}
