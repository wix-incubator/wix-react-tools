import * as React from "react";
import {
    Attributes,
    ClassicComponent,
    ClassicComponentClass,
    ClassType,
    Component,
    ComponentClass,
    ComponentState,
    HTMLAttributes,
    ReactHTML,
    ReactNode,
    ReactSVG,
    ReactType,
    SFC
} from "react";
import { Instance } from '../core/types';

export function isNotEmptyArrayLike(arr: Array<any> | undefined): arr is Array<any> {
    return !!(arr && (arr.length > 0));
}

export function isReactClassComponent(value: any): value is React.ComponentClass<any> {
    return value && value.prototype && value.prototype instanceof React.Component;
}

export type ElementType<P> =
    keyof ReactHTML
    | keyof ReactSVG
    | string
    | SFC<P>
    | ComponentClass<P>
    | ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>;

export type ElementArgs<P extends HTMLAttributes<HTMLElement>> = {
    type: ElementType<P>,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>
}
export type ElementArgsTuple<P extends HTMLAttributes<HTMLElement>> = [ElementType<P>, undefined | (Attributes & Partial<P>), ReactNode]

export function translateArgumentsToObject<P extends {}>(args: ElementArgsTuple<P>): ElementArgs<P> {
    return {
        type: args[0],
        elementProps: args[1] || {},
        children: args.length > 2 ? Array.prototype.slice.call(args, 2) : []
    };
}

export function translateObjectToArguments<P extends {}>(args: ElementArgs<P>): ElementArgsTuple<P> {
    return [args.type, args.elementProps, ...args.children] as ElementArgsTuple<P>;
}

export type Rendered<P = {}> = Component<P>;

export interface ElementHook<P extends object, T extends Rendered<P> = Rendered<P>> {
    <E = object>(this: Instance<T>|undefined, props: P, args: ElementArgs<E>): ElementArgs<E>
}

export interface StatefulElementHook<P extends object, T extends Rendered<P> = Rendered<P>> {
    <E = object>(this: Instance<T>, props: P, args: ElementArgs<E>): ElementArgs<E>
}

export interface StatelessElementHook<P extends object> {
    <E = object>(props: P, args: ElementArgs<E>): ElementArgs<E>
}

export interface StatelessDecorReactHooks<P extends object> {
    onRootElement?: Array<StatelessElementHook<P>>;
    onEachElement?: Array<StatelessElementHook<P>>;
}

export interface DecorReactHooks<P extends object, T extends Rendered<P> = Rendered<P>> {
    onRootElement?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
    onEachElement?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
}
