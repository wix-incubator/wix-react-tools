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
    ComponentState,
    ClassicComponentClass
} from 'react';
import { before, FunctionWrapper, middleware, MiddlewareHook } from './function-decor';
import { THList, THListToTuple } from "typelevel-ts";

export type RenderResult = JSX.Element | null | false;

export type CreateElementHook = <P = object>(componentProps: any, args: CreateElementArgs<P>) => CreateElementArgs<P>;

export type CreateElementArgs<P extends {}> = {
    type: any,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>;
}

type CreateElementArgsTuple<P extends {}> = [any, Attributes & Partial<P>, ReactNode];

type ReactCreateElement = typeof React.createElement;

const originalCreateElement = React.createElement;

interface DecorReactHooks {
    nodes?: Array<CreateElementHook>
    root?: Array<CreateElementHook>
}

// todo: fix currently only handle hooks for any element, not the root hooks
export function decorReact(hooks: DecorReactHooks): Function {
    const mw = (next: Function, args: [object]) => {
        try {
            React.createElement = makeCustomCreateElement(hooks, args[0]); // [0] for props in a functional react component
            return next(args);
        } finally {
            React.createElement = originalCreateElement as ReactCreateElement;
        }
    }
    return middleware(mw);
}

// create a custom react create element function that applies the given hooks
function makeCustomCreateElement(hooks: DecorReactHooks, componentProps: object): ReactCreateElement {
    if (hooks.nodes && hooks.nodes.length) {
        const executeHook = (res: CreateElementArgs<any>, hook: CreateElementHook): CreateElementArgs<any> => {
            return hook(componentProps, res);
        };
        const beforeHook = (createElementArgsTuple: CreateElementArgsTuple<any>) => {
            let createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
            createElementArgsObject = hooks.nodes!.reduce(executeHook, createElementArgsObject); // we checked hooks.nodes is defined
            return translateObjectToArguments(createElementArgsObject);
        };
        return before(beforeHook)(originalCreateElement);
    } else {
        return originalCreateElement;
    }
}

function translateArgumentsToObject<P extends object>(args: CreateElementArgsTuple<P>): CreateElementArgs<P> {
    return {
        type: args[0],
        elementProps: args[1],
        children: Array.prototype.slice.call(args, 2)
    };
}

function translateObjectToArguments<P extends object>(args: CreateElementArgs<P>): CreateElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as CreateElementArgsTuple<P>;
}
