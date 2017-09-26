import {ClassDecorator} from "../class-decor/index";
import {decorFunction} from "../function-decor";
import * as React from "react";
import {HTMLAttributes, ReactElement, Component, cloneElement} from "react";
import {
    DecorReactHooks, ElementArgs, ElementArgsTuple, StatefulElementHook, translateArgumentsToObject
} from "./common";
import {List, mix, MixerData, unsafeMixerData} from "../class-decor/mixer";
import {Class, GlobalConfig, Instance} from "../core/types";
import {classPrivateState, ClassStateProvider} from "../core/class-private-state";
import {getGlobalConfig, runInContext} from "../core/config";

import ReactCurrentOwner = require('react/lib/ReactCurrentOwner');

// TODO: make union based of all different overloaded signatures of createElement
// also consider <P extends HTMLAttributes<HTMLElement>>
// export type ElementHook<T extends Component<any>> = <P = object>(instance: T, args: ElementArgs<P>) => ElementArgs<P>;

const original: typeof React.createElement = React.createElement;
// for root replication use React.cloneElement()

function preRenderHook<T extends Component<any>>(instance: Instance<T>, args: never[]) {
    // find the lowest ReactDecorData attached to the instance
    let currentReactDecorData = reactMixData.unsafe.inherited(instance.constructor);
    currentReactDecorData.lastRendering = instance;
    (React as any).createElement = currentReactDecorData.createElementProxy;
    return args;
}

function postRenderHook<T extends Component<any>>(instance: Instance<T>, methodResult: ReactElement<any>) {
    // clean up createElement function
    (React as any).createElement = original;
    // find the lowest ReactDecorData attached to the instance
    let currentReactDecorData = reactMixData.unsafe.inherited(instance.constructor);
    return currentReactDecorData.handleRoot(methodResult);
}


type Config = {
    /**
     * flag to force render hooks even outside react lifecycle
     */
    simulateReactDecor?: boolean;
}

export function simulateRender(component: React.ComponentClass): JSX.Element | null | false {
    return runInContext({simulateReactDecor: true}, () => {
        return new component().render();
    });
}

function arraysAreEqual(arr1: Array<any>, arr2: Array<any>): boolean {
    let arr1Length = arr1.length;
    if (arr1Length !== arr2.length) {
        return false;
    }
    
    while (arr1Length--) {
        if (arr1[arr1Length] !== arr2[arr1Length]) {
            return false;
        }
    }

    return true;
}

class ReactDecorData<P extends object, T extends Component<P> = Component<P>> {
    onEachElementHooks: List<StatefulElementHook<P, T>>;
    onRootElementHooks: List<StatefulElementHook<P, T>>;
    createElementProxy = decorFunction({
        before: [this.beforeCreateElementHook.bind(this)],
        after: [this.afterCreateElementHook.bind(this)]
    })(original);
    lastRendering: T;
    originalArgs = new Map<ReactElement<any>, ElementArgsTuple<any>>();
    currentArgs: ElementArgsTuple<any> | null = null;

    constructor(mixData: MixerData<T>, superData: ReactDecorData<any> | null) {
        this.onEachElementHooks = new List(superData && superData.onEachElementHooks);
        this.onRootElementHooks = new List(superData && superData.onRootElementHooks);
        if (!superData) {
            mixData.addBeforeHook(preRenderHook, 'render'); // hook react-decor's lifecycle
            mixData.addAfterHook(postRenderHook, 'render'); // hook react-decor's lifecycle
        }
    }

    handleRoot<C extends Component<any>>(rootElement: ReactElement<any>) {
        if (rootElement) {
            let rootArgs = this.originalArgs.get(rootElement);
            this.originalArgs.clear();
            if (rootArgs === undefined) {
                if (getGlobalConfig<GlobalConfig>().devMode) {
                    console.warn('unexpected root node :', rootElement);
                }
            } else {
                let rootArgsObj = translateArgumentsToObject(rootArgs);
                this.onRootElementHooks.collect().forEach((hook: StatefulElementHook<P, T>) => {
                    rootArgsObj = hook.call(this.lastRendering, this.lastRendering.props, rootArgsObj);
                    if (rootArgs === undefined) {
                        throw new Error('Error: onRootElement hook returned undefined');
                    }
                });
                
                if (rootElement.props.children && rootElement.props.children.length !== undefined && arraysAreEqual(rootElement.props.children, rootArgsObj.children)) {
                    // optimisation for when children are equal before/after root hook
                    return cloneElement(rootElement, rootArgsObj.elementProps);
                } else {
                    return cloneElement(rootElement, rootArgsObj.elementProps, ...rootArgsObj.children);
                }
            }
        }
        return rootElement;
    }

    beforeCreateElementHook<E extends HTMLAttributes<HTMLElement>>(functionArgs: ElementArgsTuple<E>) {
        // check if original render is over, then clean up and call original
        if ((ReactCurrentOwner.current && ReactCurrentOwner.current._instance === this.lastRendering) || getGlobalConfig<Config>().simulateReactDecor) {
            let args: ElementArgs<E> = translateArgumentsToObject(functionArgs);
            this.onEachElementHooks.collect().forEach((hook: StatefulElementHook<P, T>) => {
                args = hook.call(this.lastRendering, this.lastRendering.props, args);
                if (args === undefined) {
                    throw new Error('Error: onChildElement hook returned undefined');
                }
            });
            this.currentArgs = functionArgs;
            return [args.type, args.elementProps, ...args.children];
        } else {
            (React as any).createElement = original;
            return functionArgs;
        }
    };

    afterCreateElementHook(methodResult: ReactElement<any>) {
        if (this.currentArgs) {
            this.originalArgs.set(methodResult, this.currentArgs);
            this.currentArgs = null;
        }
        return methodResult;
    };
}

const reactMixData: ClassStateProvider<ReactDecorData<object, Component<any>>, Class<Component<any>>> =
    classPrivateState('react-decor data', <T extends Component<any>>(clazz: Class<T>) => {
        let mixerData = unsafeMixerData<T>(clazz); // get data of mixer
        const inherited = reactMixData.inherited(clazz);
        return new ReactDecorData<T>(mixerData, inherited); // create react-decor data
    });

export function onChildElement<P extends object, T extends Component<any>>(hook: StatefulElementHook<P, T>): ClassDecorator<T> {
    return function onChildElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).onEachElementHooks.add(hook);
        return mixed;
    };
}

export function onRootElement<P extends object, T extends Component<any>>(hook: StatefulElementHook<P, T>): ClassDecorator<T> {
    return function onRootElementDecorator<C extends Class<T>>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        reactMixData(mixed).onRootElementHooks.add(hook);
        return mixed;
    };
}

export function decorReactClass<P extends object, T extends Component<any>>(hooks: DecorReactHooks<P, T>): ClassDecorator<T> {
    return function reactClassDecorator<C extends Class<T> & React.ComponentClass>(componentClazz: C): C {
        let mixed = mix(componentClazz);
        const mixData = reactMixData(mixed);
        hooks.onEachElement && hooks.onEachElement.forEach(h => {
            mixData.onRootElementHooks.add(h);
            mixData.onEachElementHooks.add(h);
        });
        hooks.onRootElement && hooks.onRootElement.forEach(h => {
            mixData.onRootElementHooks.add(h);
        });

        if (getGlobalConfig<GlobalConfig>().devMode && !mixed.displayName && componentClazz.name) {
            mixed.displayName = componentClazz.name;
        }
        return mixed;
    };
}
