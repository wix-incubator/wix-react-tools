import {Class, ClassDecorator} from "./class-decor";
import * as React from "react";
import {
    CElement,
    ClassicComponent, ClassicComponentClass, ClassType, ComponentClass, ComponentState, DOMElement, ReactElement,
    ReactHTML,
    ReactHTMLElement,
    ReactNode, ReactSVG, ReactSVGElement,
    SFC, SFCElement
} from "react";

export type Rendered<P extends object> = {
    props:P;
    render(): JSX.Element | null | false;
};

// TODO: make union based of all different overloaded signatures of createElement
export type CreateElementHook<T extends Rendered<any>> = <P = object>(
                                    instance: T,
                                    type: ElementType<P>,
                                    props: P,
                                    children: Array<ReactNode>,
                                    next: CreateElementNext<P>) => ElementReturnType<P>;

export type CreateElementNext<P> = (type: ElementType<P>, props?: P, ...children: Array<ReactNode>) => ReactElement<P>;

export type ElementType<P> = keyof ReactHTML | keyof ReactSVG | string | SFC<P> | ComponentClass<P> | ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>;
export type ElementReturnType<P> = ReactHTMLElement<any> | ReactSVGElement | DOMElement<P, any> | SFCElement<P> | ReactElement<P> | CElement<P, ClassicComponent<P, ComponentState>>;

/*

 function createElement<P extends HTMLAttributes<T>, T extends HTMLElement>(
 type: keyof ReactHTML,
 props?: ClassAttributes<T> & P,
 ...children: ReactNode[]): ReactHTMLElement<T>;
 function createElement<P extends SVGAttributes<T>, T extends SVGElement>(
 type: keyof ReactSVG,
 props?: ClassAttributes<T> & P,
 ...children: ReactNode[]): ReactSVGElement;
 function createElement<P extends DOMAttributes<T>, T extends Element>(
 type: string,
 props?: ClassAttributes<T> & P,
 ...children: ReactNode[]): DOMElement<P, T>;
 function createElement<P>(
 type: SFC<P>,
 props?: Attributes & P,
 ...children: ReactNode[]): SFCElement<P>;
 function createElement<P>(
 type: ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>,
 props?: ClassAttributes<ClassicComponent<P, ComponentState>> & P,
 ...children: ReactNode[]): CElement<P, ClassicComponent<P, ComponentState>>;
 function createElement<P, T extends Component<P, ComponentState>, C extends ComponentClass<P>>(
 type: ClassType<P, T, C>,
 props?: ClassAttributes<T> & P,
 ...children: ReactNode[]): CElement<P, T>;
 function createElement<P>(
 type: ComponentClass<P>,
 props?: Attributes & P,
 ...children: ReactNode[]): ReactElement<P>;

 */
export function registerForCreateElement<T extends Rendered<any>>(hook: CreateElementHook<T>): ClassDecorator<T> {
    return null as any;
}

/*
 @registerForCreateElement((a,bb,c,d)=>{})
 class Comp extends...


 */
