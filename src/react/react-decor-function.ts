import React = require('react');
import {
    Attributes,
    ReactElement,
    ReactNode,
    SFC,
    cloneElement
} from 'react';
import { decorFunction } from '../function-decor';

export type ElementHook = <P = object>(componentProps: any, args: ElementArgs<P>) => ElementArgs<P>;

export type ElementArgs<P extends {}> = {
    type: any,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>
}
export type CreateElementArgsTuple<P extends {}> = [any, Attributes & Partial<P>, ReactNode];

type ReactCreateElement = typeof React.createElement;
const originalCreateElement = React.createElement;

export interface DecorReactHooks {
    nodes?: Array<ElementHook>;
    root?: Array<ElementHook>;
}

export interface makeCustomElementContext<P extends {}> {
    hooks: DecorReactHooks;
    componentProps: object;
    createArgsMap: Map<object, ElementArgs<P>>;
}

function hooksDefined(hooks: Array<ElementHook> | undefined): hooks is Array<ElementHook> {
    return !!(hooks && (hooks.length > 0));
}

function getHooksReducer(componentProps: object): (res: ElementArgs<any>, hook: ElementHook) => ElementArgs<any> {
    return <P extends {}>(res: ElementArgs<P>, hook: ElementHook) => hook(componentProps, res);
}

export function decorReact<T = any>(hooks: DecorReactHooks): (comp: SFC<T>) => SFC<T> {
    const context: makeCustomElementContext<T> = {
        hooks,
        componentProps: {},
        createArgsMap: new Map()
    };
    const wrappedCreateElement = makeCustomCreateElement(context);

    const replaceCreateElement = (args: CreateElementArgsTuple<any>): CreateElementArgsTuple<any> => {
        context.componentProps = args[0]; // [0] for props in a functional react component
        React.createElement = wrappedCreateElement;
        return args;
    };

    const applyRootHooks = <P extends {}>(renderResult: ReactElement<P>): ReactElement<P> => {
        if (hooksDefined(hooks.root)) {
            let rootElementArgs = context.createArgsMap.get(renderResult);

            if (rootElementArgs) {
                rootElementArgs = hooks.root.reduce(getHooksReducer(context.componentProps), rootElementArgs);
                renderResult = cloneElement(renderResult, rootElementArgs.elementProps);
            } else {
                console.warn('unable to find matching component for: ', renderResult);
            }
        }
        context.createArgsMap.clear();
        React.createElement = originalCreateElement as ReactCreateElement;
        return renderResult;
    };

    return decorFunction({
        before: [replaceCreateElement],
        after: [applyRootHooks]
    });
}

// create a custom react create element function that applies the given hooks
function makeCustomCreateElement<P extends {}>(context: makeCustomElementContext<P>): typeof React.createElement {
    let createElementArgsObject: ElementArgs<P>;

    const applyHooksOnArguments = (createElementArgsTuple: CreateElementArgsTuple<P>): CreateElementArgsTuple<P> => {
        createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
        if (hooksDefined(context.hooks.nodes)) {
            createElementArgsObject = context.hooks.nodes.reduce(getHooksReducer(context.componentProps), createElementArgsObject);
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
        elementProps: args[1],
        children: Array.prototype.slice.call(args, 2)
    };
}

function translateObjectToArguments<P extends {}>(args: ElementArgs<P>): CreateElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as CreateElementArgsTuple<P>;
}
