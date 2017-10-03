import React = require('react');
import {Attributes, cloneElement, ReactElement, ReactNode, ReactType, SFC} from "react";
import {decorFunction, middleware} from "../functoin-decor/index";
import {
    DecorReactHooks, ElementArgs, StatelessElementHook, isNotEmptyArrayLike, translateArgumentsToObject,
    translateObjectToArguments, resetReactCreateElement, originalReactCreateElement
} from "./common";

declare const process: { env: { [k: string]: any } };

export type CreateElementArgsTuple<P extends {}> = [ReactType, undefined | (Attributes & Partial<P>), ReactNode];
export type SFCDecorator<T extends object> = <T1 extends T>(comp: SFC<T1>) => SFC<T1>;

export interface HookContext<T extends object> {
    hooks: DecorReactHooks<T>;
    componentProps: T;
    createArgsMap: Map<object, ElementArgs<any>>;
}

function getHooksReducer<T extends object>(componentProps: T) {
    return <P extends {}>(res: ElementArgs<P>, hook: StatelessElementHook<T>) => hook(componentProps, res);
}

const translateName = middleware((next: (args: [React.SFC]) => React.SFC, args: [React.SFC]) => {
    const result: React.SFC = next(args);
    if (!result.displayName && args[0].name) {
        result.displayName = args[0].name;
    }
    return result;
});
const emptyObj = Object.freeze({});
const context = {
    hooks: emptyObj,
    componentProps: emptyObj,
    createArgsMap: new Map()
} as HookContext<object>; // componentProps will be overwritten before render
const wrappedCreateElement = makeCustomCreateElement(context);

export function decorReactFunc<T extends {}>(hooks: DecorReactHooks<T>): SFCDecorator<T> {

    function replaceCreateElement(args: [object, any]): [object, any] {
        if (React.createElement !== wrappedCreateElement) {
            context.createArgsMap.clear();
            context.hooks = hooks;
            context.componentProps = args[0]; // [0] for props in a functional react component
            React.createElement = wrappedCreateElement;
        }
        return args;
    }

    function applyRootHooks<P extends {}>(renderResult: ReactElement<P>): ReactElement<P> {
        if (renderResult && isNotEmptyArrayLike(hooks.onRootElement)) {
            let rootElementArgs = context.createArgsMap.get(renderResult);

            if (rootElementArgs) {
                rootElementArgs = hooks.onRootElement.reduce(getHooksReducer(context.componentProps), rootElementArgs);
                renderResult = cloneElement(renderResult, (rootElementArgs!).elementProps, ...rootElementArgs!.children);
                context.createArgsMap.set(renderResult, rootElementArgs!);
            } else if (process.env.NODE_ENV !== 'production') {
                console.warn('unexpected root node : ', renderResult);
            }
        }
        resetReactCreateElement();
        return renderResult;
    }

    const decorator = decorFunction({
        before: [replaceCreateElement],
        after: [applyRootHooks]
    });

    return process.env.NODE_ENV !== 'production' ? translateName(decorator) : decorator;
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
    })(originalReactCreateElement);
}
