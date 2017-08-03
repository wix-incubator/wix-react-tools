import {before, ClassDecorator} from "./class-decor/index";
import * as React from "react";
import {
    Attributes,
    CElement,
    ClassicComponent,
    ClassicComponentClass,
    ClassType,
    ComponentClass,
    ComponentState,
    DOMElement,
    HTMLAttributes,
    ReactElement,
    ReactHTML,
    ReactHTMLElement,
    ReactNode,
    ReactSVG,
    ReactSVGElement,
    SFC,
    SFCElement
} from "react";
import {Class, customMixin, MixedClass, MixerData, unsafeMixerData} from "./class-decor/mixer";

import ReactCurrentOwner = require('react/lib/ReactCurrentOwner');

export type RenderResult = JSX.Element | null | false;
export type Rendered<P extends object> = {
    props: P;
    render(): RenderResult;
};

export type CreateElementArgs<P extends {}> = {
    type: ElementType<P>,
    props: Attributes & Partial<P>,
    children: Array<ReactNode>;
}

// TODO: make union based of all different overloaded signatures of createElement
// also consider <P extends HTMLAttributes<HTMLElement>>
export type CreateElementHook<T extends Rendered<any>> = <P  = object>(instance: T, args: CreateElementArgs<P>) => CreateElementArgs<P>;

export type ElementType<P> =
    keyof ReactHTML
    | keyof ReactSVG
    | string
    | SFC<P>
    | ComponentClass<P>
    | ClassType<P, ClassicComponent<P, ComponentState>, ClassicComponentClass<P>>;

export type ElementReturnType<P> =
    ReactHTMLElement<any>
    | ReactSVGElement
    | DOMElement<P, any>
    | SFCElement<P>
    | ReactElement<P>
    | CElement<P, ClassicComponent<P, ComponentState>>;

const original: typeof React.createElement = React.createElement;
// for root replication use React.cloneElement()

function cleanUpHook<P extends HTMLAttributes<HTMLElement>>(type: ElementType<P>, props: any, children: Array<ReactNode>) {
    (React as any).createElement = original;
    return original(type as any, props, ...children);
}

export interface ReactMixerData<T extends Rendered<any>> extends MixerData<T> {
    createElementHooks: Array<CreateElementHook<T>>;
    lastRendering: T;
}

export function getReactMixerData<T extends Rendered<any>>(clazz: Class<T>): ReactMixerData<T>{
    return unsafeMixerData(clazz) as ReactMixerData<T>;
}
type ReactMixedClass<T extends Rendered<any>> = Class<T>;

function createElementProxy<T extends Rendered<any>, P extends HTMLAttributes<HTMLElement>>(this: ReactMixerData<T>, type: ElementType<P>, props: Attributes & Partial<P> = {}, ...children: Array<ReactNode>) {
    // check if original render is over, then clean up and call original
    if (ReactCurrentOwner.current && ReactCurrentOwner.current._instance === this.lastRendering) {
        let args: CreateElementArgs<P> = {type, props, children};
        this.createElementHooks.forEach((hook: CreateElementHook<T>) => {
            args = hook(this.lastRendering, args);
            if (args === undefined) {
                throw new Error('@registerForCreateElement Error: hook returned undefined');
            }
        });
        return original<Partial<P>>(args.type as any, args.props, ...args.children);
    } else {
        return cleanUpHook(type, props, children);
    }
}

function isReactMix<T extends Rendered<any>>(arg: MixedClass<T>): arg is ReactMixedClass<T> {
    return !!getReactMixerData(arg).createElementHooks;
}

function initReactMix<C extends MixedClass<Rendered<any>>>(mixed: C): C & ReactMixedClass<Rendered<any>> {
    const reactMixed = mixed as C & ReactMixedClass<Rendered<any>>;
    getReactMixerData(reactMixed).createElementHooks = [];
    const boundProxy = createElementProxy.bind(getReactMixerData(reactMixed));

    function reactDecorBeforeRenderHook(instance: Rendered<any>, args: never[]) {
        getReactMixerData(reactMixed).lastRendering = instance;
        (React as any).createElement = boundProxy;
        return args;
    }

    return before(reactDecorBeforeRenderHook, 'render')(reactMixed) as typeof reactMixed;
}
const reactMix: <C extends Class<Rendered<any>>>(clazz: C) => C & ReactMixedClass<Rendered<any>>
    = customMixin.bind(null, initReactMix, isReactMix);

export function registerForCreateElement<T extends Rendered<any>>(hook: CreateElementHook<T>): ClassDecorator<T> {
    return function registerForCreateElementDecorator<C extends Class<T>>(t: C): C {
        const mixed = reactMix(t);
        getReactMixerData(mixed).createElementHooks.push(hook);
        return mixed;
    };
}
