import * as React from 'react';
import {
    Attributes,
    ComponentClass,
    ClassType,
    ClassicComponent,
    ClassicComponentClass,
    Component,
    ComponentState,
    ReactNode,
    ReactHTML,
    ReactSVG,
    SFC
} from 'react';

export function isNotEmptyArray(arr: Array<any> | undefined): arr is Array<any> {
    return !!(arr && (arr.length > 0));
}

export function isReactClassComponent(value: any): value is React.ComponentClass<any> {
    return value && value.prototype && value.prototype instanceof React.Component;
}

export function isRendered(obj:any): obj is Rendered<any>{
    return obj && typeof obj.render === 'function';
}

export type ElementType<P> =
keyof ReactHTML
| keyof ReactSVG
| string
| SFC<P>
| ComponentClass<P>
| ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>;

export type ElementArgs<P extends {}> = {
    type: any,
    elementProps: Attributes & Partial<P>,
    children: Array<ReactNode>
}

export type RenderResult = JSX.Element | null | false; // fits the render result of react's component

export type Rendered<P extends object> = Component<P>
