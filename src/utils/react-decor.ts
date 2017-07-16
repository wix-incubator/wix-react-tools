import {chain, Class, ClassDecorator, before, after as afterMethod} from "./class-decor";
import * as React from "react";
import {
    Attributes,
    CElement,
    ClassicComponent, ClassicComponentClass, ClassType, ComponentClass, ComponentState, DOMElement, ReactElement,
    ReactHTML,
    ReactHTMLElement,
    ReactNode, ReactSVG, ReactSVGElement,
    SFC, SFCElement
} from "react";

import ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
import {mix, MixerData} from "./mixer";

export type RenderResult = JSX.Element | null | false;
export type Rendered<P extends object> = {
    props: P;
    render(): RenderResult;
};

export type CreateElementArgs<P> = {
    type: ElementType<P>,
    props: Attributes & Partial<P>,
    children: Array<ReactNode>;
}

// TODO: make union based of all different overloaded signatures of createElement
export type CreateElementHook<T extends Rendered<any>> = <P = object>(instance: T, args: CreateElementArgs<P>) => CreateElementArgs<P>;

export type CreateElementNext<P> = (type: ElementType<P>, props?: P, ...children: Array<ReactNode>) => ReactElement<P>;

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

function cleanUpHook(type: React.ComponentClass, props: any, children: Array<ReactNode>) {
    (React as any).createElement = original;
    return original(type, props, ...children);
}

interface ReactMixerData<T extends Rendered<any>> extends MixerData<T> {
    createElementHooks: Array<CreateElementHook<T>>;
}

function isReactMixerData<T extends Rendered<any>>(arg: MixerData<T>): arg is ReactMixerData<T> {
    return !!(arg as ReactMixerData<T>).createElementHooks;
}

function makeBeforeRenderHook<T extends Rendered<any>>(mixerData: ReactMixerData<T>) {
    return (instance: T, args: never[]) => {
        // TODO move boundHook to class-level (keep track of instance in mixerData)
        // monkey-patch React.createElement with our hook
        function boundHook<P = object>(type: ComponentClass<P>, props: Attributes & Partial<P> = {}, ...children: Array<ReactNode>) {
            // check if original render is over, then clean up and call original
            if (ReactCurrentOwner.current && ReactCurrentOwner.current._instance === instance) {
                let args: CreateElementArgs<P> = {type, props, children};
                mixerData.createElementHooks.forEach((hook: CreateElementHook<T>) => {
                    args = hook(instance, args);
                    if (args === undefined) {
                        throw new Error('@registerForCreateElement Error: hook returned undefined');
                    }
                });
                return original<Partial<P>>(args.type as any, args.props, ...args.children);
            } else {
                return cleanUpHook(type, props, children);
            }
        }

        (React as any).createElement = boundHook;
        return args;
    }
}

export function registerForCreateElement<T extends Rendered<any>>(hook: CreateElementHook<T>): ClassDecorator<T> {
    return function decorator<T1 extends T>(t: Class<T1>) {
        const mixed = mix(t);
        const mixerData = mixed.$mixerData;
        if (isReactMixerData(mixerData)) {
            mixerData.createElementHooks.push(hook);
            return mixed;
        } else {
            let reactMD = mixerData as ReactMixerData<T1>;
            reactMD.createElementHooks = [hook];
            const beforeRenderHook = makeBeforeRenderHook(reactMD);
            return before(beforeRenderHook, 'render')(mixed);
        }
    };
}
