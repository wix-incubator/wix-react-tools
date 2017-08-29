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

export type ElementArgs<P extends {}> = {
    type: ReactType,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>
}
export type ElementArgsTuple<E extends HTMLAttributes<HTMLElement>> = [ElementType<E>, Attributes & Partial<E>, ReactNode]

export type Rendered<P = {}> = Component<P>;

export interface ElementHook<P extends object, T extends Rendered<P> = Rendered<P>> {
    <E = object>(instance: T | null, props: P, args: ElementArgs<E>): ElementArgs<E>
}

export interface StatefulElementHook<P extends object, T extends Rendered<P> = Rendered<P>> {
    <E = object>(instance: T, props: P, args: ElementArgs<E>): ElementArgs<E>
}


export interface StatelessElementHook<P extends object> {
    <E = object>(instance: null, props: P, args: ElementArgs<E>): ElementArgs<E>
}


export interface StatelessDecorReactHooks<P extends object> {
    onRootElement ?: Array<StatelessElementHook<P>>;
    onEachElement?: Array<StatelessElementHook<P>>;
}

export interface DecorReactHooks<P extends object, T extends Rendered<P> = Rendered<P>> {
    onRootElement ?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
    onEachElement?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
}

