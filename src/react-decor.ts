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
import { THList, THListToTuple} from "typelevel-ts";

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

export function decorReact(hooks: DecorReactHooks): Function {
    return middleware(createHook(hooks));
}

// only handle hooks for any element, not the root hooks
function createHook(hooks: DecorReactHooks) {
    const customRenderCreateElement = makeCustomCreateElement(hooks);
    return (next: Function, args: [object]) => {
        try {
            React.createElement = customRenderCreateElement(args[0]); // [0] for props in a functional react component
            return next(args);
        } finally {
            React.createElement = originalCreateElement as ReactCreateElement;
        }
    }
}

function makeCustomCreateElement(hooks: DecorReactHooks): (componentProps: object) => ReactCreateElement {
    const hook = hooks.nodes[0];

    return (componentProps: object) => {
        const beforeHook = (createElementArgs: CreateElementArgsTuple<any>) => {
            return translateObjectToArguments(hook(componentProps, translateArgumentsToObject(createElementArgs)));
        };
        return before(beforeHook)(originalCreateElement);
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
