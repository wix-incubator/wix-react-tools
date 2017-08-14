import React = require('react');
import {
    Attributes,
    ReactNode,
    ReactHTML,
    ReactSVG,
    SFC,
    ComponentClass,
    ClassType,
    ClassicComponent,
    cloneElement,
    ComponentState,
    ClassicComponentClass
} from 'react';
import { after, before, FunctionWrapper, middleware, MiddlewareHook } from './function-decor';
import { THList, THListToTuple } from "typelevel-ts";
import { cloneDeep } from 'lodash';


export type ElementHook = <P = object>(componentProps: any, args: ElementArgs<P>) => ElementArgs<P>;
export type RootNodeHook = <P = object>(componentProps: any, rootNodeProps: Attributes & Partial<P>) => Attributes & Partial<P>;

export type ElementArgs<P extends {}> = {
    type: any,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>
}
export type CreateElementArgsTuple<P extends {}> = [any, Attributes & Partial<P>, ReactNode];

type ReactCreateElement = typeof React.createElement;

const originalCreateElement = React.createElement;

export interface DecorReactHooks {
    nodes?: Array<ElementHook>
    root?: Array<ElementHook>
}

export function decorReact(hooks: DecorReactHooks): Function {
    const mw = (next: Function, args: [object]) => {
        let renderResult, createArgsMap: Map<object, ElementArgs<any>> = new Map();

        try {
            const componentProps = args[0]; // [0] for props in a functional react component
            let wrappedCreateElement = makeCustomCreateElement(hooks, componentProps, createArgsMap);
            React.createElement = wrappedCreateElement;

            renderResult = next(args);

            if (hooks.root && hooks.root.length > 0) {
                let rootElementArgs = createArgsMap.get(renderResult);

                rootElementArgs = hooks.root.reduce(<P extends {}>(elementArgs: ElementArgs<P>, hook: ElementHook): ElementArgs<P> => hook(componentProps, elementArgs), rootElementArgs);

                if (rootElementArgs) {
                    renderResult = cloneElement(renderResult, rootElementArgs.elementProps);
                }
            }
        } finally {
            React.createElement = originalCreateElement as ReactCreateElement;
            createArgsMap.clear();
        }

        return renderResult;
    }
    return middleware(mw);
}

// create a custom react create element function that applies the given hooks
function makeCustomCreateElement<P extends {}>(hooks: DecorReactHooks, componentProps: object, createArgsMap: Map<object, ElementArgs<P>>): typeof originalCreateElement {
    let wrappedCreateElement = originalCreateElement;

    const executeHook = (res: ElementArgs<any>, hook: Function): ElementArgs<any> => {
        return hook(componentProps, res);
    };

    if ((hooks.nodes && hooks.nodes.length) || (hooks.root && hooks.root.length)) {
        const mwHook = (next: Function, createElementArgsTuple: CreateElementArgsTuple<any>) => {
            let createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
            if (hooks.nodes && hooks.nodes.length) {
                createElementArgsObject = hooks.nodes.reduce(executeHook, createElementArgsObject);
                createElementArgsTuple = translateObjectToArguments(createElementArgsObject);
            }

            let createElementResult = next(createElementArgsTuple);
            createArgsMap.set(createElementResult, createElementArgsObject);

            return createElementResult;
        };

        wrappedCreateElement = middleware(mwHook)(originalCreateElement);
    }

    return wrappedCreateElement;
}

export function translateArgumentsToObject<P extends object>(args: CreateElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0],
        elementProps: args[1],
        children: Array.prototype.slice.call(args, 2)
    };
}

export function translateObjectToArguments<P extends object>(args: ElementArgs<P>): CreateElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as CreateElementArgsTuple<P>;
}
