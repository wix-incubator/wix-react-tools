import React = require('react');
import {
    Attributes,
    ReactElement,
    ReactNode,
    SFC,
    cloneElement
} from 'react';
import { BeforeHook, AfterHook, decorFunction, HookWrappers } from '../function-decor';
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

function hooksDefined(hooks: Array<ElementHook> | undefined): boolean {
    return !!(hooks && (hooks.length > 0))
}

function getHooksReducer(componentProps: object): (res: ElementArgs<any>, hook: ElementHook) => ElementArgs<any> {
    return <P extends {}>(res: ElementArgs<P>, hook: ElementHook) => hook(componentProps, res);
};

export function decorReact<T = any>(hooks: DecorReactHooks): (comp: SFC<T>) => SFC<T> {
    let componentProps: Attributes & Partial<any>;
    let createArgsMap: Map<object, ElementArgs<any>> = new Map();
    const decors: {before: Array<BeforeHook<any>>, after: Array<AfterHook<any>>} = {
        before: [],
        after: []
    };

    if (hooksDefined(hooks.nodes) || hooksDefined(hooks.root)) {
        const replaceCreateElement = (args: CreateElementArgsTuple<any>): CreateElementArgsTuple<any> => {
            componentProps = args[0]; // [0] for props in a functional react component
            React.createElement = makeCustomCreateElement(hooks, componentProps, createArgsMap);
            return (args as CreateElementArgsTuple<any>);
        };

        const applyRootHooks = <P extends {}>(renderResult: ReactElement<P>): ReactElement<P> => {
            if (hooksDefined(hooks.root)) {
                let rootElementArgs = createArgsMap.get(renderResult);

                rootElementArgs = (hooks as { root: Array<ElementHook> }).root.reduce(getHooksReducer(componentProps), rootElementArgs);

                if (rootElementArgs) {
                    renderResult = cloneElement(renderResult, rootElementArgs.elementProps);
                } else {
                    console.warn('unable to found matching component for: ', rootElementArgs); // todo: test this?
                }
            }

            createArgsMap.clear();
            return renderResult;
        };

        decors.before.push(replaceCreateElement);
        decors.after.push(applyRootHooks);
        React.createElement = originalCreateElement as ReactCreateElement;
    };

    return decorFunction(decors) as (comp: SFC<T>) => SFC<T> ; // as SFC?
}

// create a custom react create element function that applies the given hooks
function makeCustomCreateElement<P extends {}>(hooks: DecorReactHooks, componentProps: object, createArgsMap: Map<object, ElementArgs<P>>): typeof React.createElement {
    if (hooksDefined(hooks.nodes) || hooksDefined(hooks.root)) {
        let createElementArgsObject: ElementArgs<P>;

        const applyHooksOnArguments = (createElementArgsTuple: CreateElementArgsTuple<P>): CreateElementArgsTuple<P> => {
            createElementArgsObject = translateArgumentsToObject(createElementArgsTuple);
            if (hooksDefined(hooks.nodes)) {
                createElementArgsObject = (hooks as { nodes: Array<ElementHook> }).nodes.reduce(getHooksReducer(componentProps), createElementArgsObject);
                return createElementArgsTuple = translateObjectToArguments(createElementArgsObject);
            }

            return createElementArgsTuple;
        };

        const saveCreateElementArguments = (createElementResult: ReactNode): ReactNode => {
            if (createElementResult) {
                createArgsMap.set((createElementResult as any), createElementArgsObject); // TODO: react create element can return many things, what do?
            }
            return createElementResult;
        };

        return decorFunction({
            before: [applyHooksOnArguments],
            after: [saveCreateElementArguments]
        })(originalCreateElement);
    } else {
        return originalCreateElement;
    }
}

export function translateArgumentsToObject<P extends {}>(args: CreateElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0],
        elementProps: args[1],
        children: Array.prototype.slice.call(args, 2)
    };
}

export function translateObjectToArguments<P extends {}>(args: ElementArgs<P>): CreateElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as CreateElementArgsTuple<P>;
}
