import {Component} from "react";
import {
    DecorReactHooks,
    DecorReacWrapArguments,
    ElementArgs,
    ElementHook,
    Stateful,
    StatefulElementHook,
    StatelessDecorReactHooks,
    StatelessElementHook,
    Wrapper
} from "./common";
import {reactDecor} from "./logic";
import {cloneFunction} from "../functoin-decor/index";

export {reactDecor} from "./logic";

export {decorReactClass} from "./react-decor-class";
export {
    DecorReactHooks,
    StatelessDecorReactHooks,
    StatefulElementHook,
    StatelessElementHook,
    Wrapper,
    ElementArgs
} from "./common";

export function makeDecorReacWrapArguments<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): DecorReacWrapArguments<P, T> {
    return {
        statelessHooks: statelessHooks,
        classHooks: classHooks || statelessHooks
    };
}

export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): Wrapper<P> {
    return reactDecor.makeWrapper(makeDecorReacWrapArguments(statelessHooks, classHooks));
}

// TODO: remove
export function elementHooks<S extends Stateful, P extends object>(onRootElement: Array<ElementHook<S, P>> | null, onEachElement: Array<ElementHook<S, P>> | null): Array<ElementHook<S, P>> {
    console.info('DEPRECATED________')
    if (onRootElement) {
        onRootElement = onRootElement.map(asRootOnly);
        if (onEachElement) {
            return onRootElement.concat(onEachElement);
        }
        return onRootElement;
    } else {
        return onEachElement!;
    }
}

export function asRootOnly<S extends Stateful, P extends object>(hook: ElementHook<S, P>): ElementHook<S, P> {
    return hook.rootOnly ? hook : makeRootOnly(cloneFunction(hook));
}

export function makeRootOnly<S extends Stateful, P extends object>(hook: ElementHook<S, P>): ElementHook<S, P> {
    if (hook.name === 'addChangeRemoveHook') {
        debugger;
    }
    hook.rootOnly = true;
    return hook;
}

// TODO: remove ?
export function onRootElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent([asRootOnly(statelessHook)], classHook ? [asRootOnly(classHook)] : undefined);
}

// TODO: remove ?
export function onEachElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent([statelessHook], classHook ? [classHook] : undefined);
}
