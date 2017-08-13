import {ClassDecorator} from "../class-decor/index";
import {before} from "../function-decor";
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
    SFC
} from "react";
import {List, mix, MixerData, unsafeMixerData} from "../class-decor/mixer";
import {Class, Instance, Rendered} from "../core/types";
import {classPrivateState, ClassStateProvider} from "../core/class-private-state";

import ReactCurrentOwner = require('react/lib/ReactCurrentOwner');

export type ChildElementArgs<P extends {}> = {
    type: ElementType<P>,
    props: Attributes & Partial<P>,
    children: Array<ReactNode>;
}

// TODO: make union based of all different overloaded signatures of createElement
// also consider <P extends HTMLAttributes<HTMLElement>>
export type ChildElementHook<T extends Rendered<any>> = <P  = object>(instance: T, args: ChildElementArgs<P>) => ChildElementArgs<P>;

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

function preRenderHook<T extends Rendered<any>>(instance: Instance<T>, args: never[]){
    // find the lowest ReactDecorData attached to the instance
    let currentReactDecorData = reactMixData.unsafe.inherited(instance.constructor);
    currentReactDecorData.lastRendering = instance;
    (React as any).createElement = currentReactDecorData.createElementProxy;
    return args;
}

class ReactDecorData<T extends Rendered<any>> {
    childElementHooks: List<ChildElementHook<T>>;
    lastRendering: T;

    constructor(mixData: MixerData<T>, superData: ReactDecorData<any> | null) {
        this.childElementHooks = new List(superData && superData.childElementHooks);
        if (!superData) {
            mixData.addBeforeHook(preRenderHook, 'render'); // hook react-decor's lifecycle
        }
    }

    createElementProxy = before(
        <P extends HTMLAttributes<HTMLElement>>(functionArgs:[ElementType<P>, Attributes & Partial<P>, ReactNode]) => {
        // check if original render is over, then clean up and call original
        if (ReactCurrentOwner.current && ReactCurrentOwner.current._instance === this.lastRendering) {
            let args: ChildElementArgs<P> = {
                type : functionArgs[0],
                props : functionArgs[1] || {},
                children : functionArgs.length > 2 ? functionArgs.slice(2) : []
            };
            this.childElementHooks.collect().forEach((hook: ChildElementHook<T>) => {
                args = hook(this.lastRendering, args);
                if (args === undefined) {
                    throw new Error('Error: onChildElement hook returned undefined');
                }
            });
            return [args.type, args.props, ...args.children];
        } else {
            (React as any).createElement = original;
            return functionArgs;
        }
    })(original);
}

const reactMixData: ClassStateProvider<ReactDecorData<Rendered<any>>, Class<Rendered<any>>> =
    classPrivateState('react-decor data', <T extends Rendered<any>>(clazz: Class<T>) => {
        let mixerData = unsafeMixerData<T>(clazz); // get data of mixer
        const inherited = reactMixData.inherited(clazz);
        return new ReactDecorData<T>(mixerData, inherited); // create react-decor data
    });

export function onChildElement<T extends Rendered<any>>(hook: ChildElementHook<T>): ClassDecorator<T> {
    return function onChildElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).childElementHooks.add(hook);
        return mixed;
    };
}
