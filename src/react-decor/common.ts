import * as React from "react";
import {
    Attributes,
    ClassicComponent,
    ClassicComponentClass,
    ClassType,
    Component,
    ComponentClass,
    ComponentState,
    ComponentType,
    DOMElement,
    HTMLAttributes,
    ReactElement,
    ReactHTML,
    ReactNode,
    ReactSVG,
    ReactType,
    SFC
} from "react";
import {Instance} from '../core/types';
import {functionDecor} from "../functoin-decor/index";
import {Feature} from "../wrappers/feature-manager";

export type Element<P extends {}> = { type: ReactType } & (DOMElement<P, any> | ReactElement<P>);

export function isReactClassComponent(value: any): value is ComponentClass<any> {
    return value && isComponentInstance(value.prototype);
}

export function isComponentInstance(value: any): value is React.Component {
    return value && value instanceof Component;
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
    newProps: Attributes & Partial<P>,
    originalElement?: Element<Partial<P>>, // only in cloneElement
    children: Array<ReactNode>
}

export type ReactFeature<P extends object> = Feature<ComponentType<P>>;

export type Falsy = void | undefined | null | 0 | false | '' ;

export type Maybe<T> = T | Falsy;

export interface StatefulElementHook<P extends object, T extends Component<P> = Component<P>> {
    rootOnly?: boolean;

    (this: Instance<T>, props: P, args: ElementArgs<any>, isRoot: boolean): Maybe<ElementArgs<any>>;
}

export type StatelessElementHook<P extends object> = StatefulElementHook<P, any>;

export type StatelessDecorReactHooks<P extends object> = Array<StatelessElementHook<P>>;

export type DecorReactHooks<P extends object, T extends Component<P> = Component<P>> = Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;

export interface ReactDecoration<P extends object, T extends Component<P> = Component<P>> {
    statelessHooks: Array<StatelessElementHook<P>>;
    classHooks: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
}

export type ElementHook<P extends object> = StatefulElementHook<P, any>;

export const translateName = functionDecor.middleware((next: (args: [React.ComponentType]) => React.ComponentType, args: [React.ComponentType]) => {
    const result: React.ComponentType = next(args);
    if (!result.displayName && args[0].name) {
        result.displayName = args[0].name;
    }
    return result;
});
