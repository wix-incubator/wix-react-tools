import {before, ClassDecorator} from "./class-decor/index";
import * as React from "react";
import {
    Attributes,
    ClassicComponent,
    ClassicComponentClass,
    ClassType,
    ComponentClass,
    ComponentState,
    HTMLAttributes,
    ReactHTML,
    ReactNode,
    ReactSVG,
    SFC,
} from "react";
import {Class, mix, MixerData, unsafeMixerData} from "./class-decor/mixer";
import {privateState} from "../../core/private-state";

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

const original: typeof React.createElement = React.createElement;
// for root replication use React.cloneElement()

function cleanUpHook<P extends HTMLAttributes<HTMLElement>>(type: ElementType<P>, props: any, children: Array<ReactNode>) {
    (React as any).createElement = original;
    return original(type as any, props, ...children);
}

class ReactDecorData<T extends Rendered<any>> {
    createElementHooks: Array<CreateElementHook<T>> = [];
    lastRendering: T;

    constructor(private mixData: MixerData<T>) {

    }

    createElementProxy = <P extends HTMLAttributes<HTMLElement>>(type: ElementType<P>, props: Attributes & Partial<P> = {}, ...children: Array<ReactNode>) => {
        // check if original render is over, then clean up and call original
        if (ReactCurrentOwner.current && ReactCurrentOwner.current._instance === this.lastRendering) {
            let args: CreateElementArgs<P> = {type, props, children};
            // TODO: traverse heritage via this.mixData and call ancestor hooks
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
    };

    preRenderHook = (instance: T, args: never[]) => {
        this.lastRendering = instance;
        (React as any).createElement = this.createElementProxy;
        return args;
    };
}

const reactMixData = privateState('react-decor data', <T extends Rendered<any>>(clazz: Class<T>) => {
    let mixerData = unsafeMixerData<T>(clazz); // get data of mixer
    const result = new ReactDecorData<T>(mixerData); // create react-decor data
    before(result.preRenderHook, 'render')(clazz); // hook into react-decor's lifecycle
    return result; // return react data object
});

export function registerForCreateElement<T extends Rendered<any>>(hook: CreateElementHook<T>): ClassDecorator<T> {
    return function registerForCreateElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).createElementHooks.push(hook);
        return mixed;
    };
}
