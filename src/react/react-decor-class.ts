import {ClassDecorator} from "../class-decor/index";
import {AfterHook, BeforeHook, decorFunction} from "../function-decor";
import * as React from "react";
import {
    Attributes,
    ClassicComponent,
    ClassicComponentClass,
    ClassType,
    ComponentClass,
    ComponentState,
    HTMLAttributes,
    ReactElement,
    ReactHTML,
    ReactNode,
    ReactSVG,
    SFC
} from "react";
import {List, mix, MixerData, unsafeMixerData} from "../class-decor/mixer";
import {Class, GlobalConfig, Instance, Rendered} from "../core/types";
import {classPrivateState, ClassStateProvider} from "../core/class-private-state";

import ReactCurrentOwner = require('react/lib/ReactCurrentOwner');
import {getGlobalConfig} from "../core/config";

export type ElementArgs<P extends {}> = {
    type: ElementType<P>,
    props: Attributes & Partial<P>,
    children: Array<ReactNode>;
}

// TODO: make union based of all different overloaded signatures of createElement
// also consider <P extends HTMLAttributes<HTMLElement>>
export type ElementHook<T extends Rendered<any>> = <P  = object>(instance: T, args: ElementArgs<P>) => ElementArgs<P>;

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

function preRenderHook<T extends Rendered<any>>(instance: Instance<T>, args: never[]) {
    // find the lowest ReactDecorData attached to the instance
    let currentReactDecorData = reactMixData.unsafe.inherited(instance.constructor);
    currentReactDecorData.lastRendering = instance;
    (React as any).createElement = currentReactDecorData.createElementProxy;
    return args;
}

function postRenderHook<T extends Rendered<any>>(instance: Instance<T>, methodResult: ReactElement<any>) {
    // clean up createElement function
    (React as any).createElement = original;
    // find the lowest ReactDecorData attached to the instance
    let currentReactDecorData = reactMixData.unsafe.inherited(instance.constructor);
    return currentReactDecorData.handleRoot(methodResult);
}

class ReactDecorData<T extends Rendered<any>> {
    childElementHooks: List<ElementHook<T>>;
    rootElementHooks: List<ElementHook<T>>;
    createElementProxy = decorFunction({
        before: [this.beforeCreateElementHook.bind(this)],
        after: [this.afterCreateElementHook.bind(this)]
    })(original);
    lastRendering: T;
    originalArgs = new Map<ReactElement<any>, ElementArgs<any>>();
    currentArgs:ElementArgs<any>|null = null;

    constructor(mixData: MixerData<T>, superData: ReactDecorData<any> | null) {
        this.childElementHooks = new List(superData && superData.childElementHooks);
        this.rootElementHooks = new List(superData && superData.rootElementHooks);
        if (!superData) {
            mixData.addBeforeHook(preRenderHook, 'render'); // hook react-decor's lifecycle
            mixData.addAfterHook(postRenderHook, 'render'); // hook react-decor's lifecycle
        }
    }

    handleRoot(rootElement: ReactElement<any>){
        let rootArgs = this.originalArgs.get(rootElement);
        this.originalArgs.clear();
        if (rootArgs === undefined) {
            if (getGlobalConfig<GlobalConfig>().devMode){
                console.warn('unexpected root node');
            }
            return rootElement;
        } else {
            this.rootElementHooks.collect().forEach((hook: ElementHook<T>) => {
                rootArgs = hook(this.lastRendering, rootArgs as ElementArgs<any>);
                if (rootArgs === undefined) {
                    throw new Error('Error: onRootElement hook returned undefined');
                }
            });
            // TODO see what's the deal with cloneElement https://facebook.github.io/react/docs/react-api.html#cloneelement
            return original(rootArgs.type as any, rootArgs.props, ...rootArgs.children);
        }
    }

    beforeCreateElementHook<P extends HTMLAttributes<HTMLElement>>(functionArgs: [ElementType<P>, Attributes & Partial<P>, ReactNode]){
        // check if original render is over, then clean up and call original
        if (ReactCurrentOwner.current && ReactCurrentOwner.current._instance === this.lastRendering) {
            let args: ElementArgs<P> = {
                type: functionArgs[0],
                props: functionArgs[1] || {},
                children: functionArgs.length > 2 ? functionArgs.slice(2) : []
            };
            this.childElementHooks.collect().forEach((hook: ElementHook<T>) => {
                args = hook(this.lastRendering, args);
                if (args === undefined) {
                    throw new Error('Error: onChildElement hook returned undefined');
                }
            });
            this.currentArgs = args;
            return [args.type, args.props, ...args.children];
        } else {
            (React as any).createElement = original;
            return functionArgs;
        }
    };

    afterCreateElementHook(methodResult: ReactElement<any>){
        if (this.currentArgs) {
            this.originalArgs.set(methodResult, this.currentArgs);
            this.currentArgs = null;
        }
        return methodResult;
    };

}

const reactMixData: ClassStateProvider<ReactDecorData<Rendered<any>>, Class<Rendered<any>>> =
    classPrivateState('react-decor data', <T extends Rendered<any>>(clazz: Class<T>) => {
        let mixerData = unsafeMixerData<T>(clazz); // get data of mixer
        const inherited = reactMixData.inherited(clazz);
        return new ReactDecorData<T>(mixerData, inherited); // create react-decor data
    });

export function onChildElement<T extends Rendered<any>>(hook: ElementHook<T>): ClassDecorator<T> {
    return function onChildElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).childElementHooks.add(hook);
        return mixed;
    };
}

export function onRootElement<T extends Rendered<any>>(hook: ElementHook<T>): ClassDecorator<T> {
    return function onRootElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).rootElementHooks.add(hook);
        return mixed;
    };
}
