import {Component, ComponentType} from "react";
import {decorationReflection} from "./react-decor-reflection";
import {decorReactClass} from "./react-decor-class";
import {
    DecorReactHooks,
    DecorReacWrapArguments,
    ElementHook,
    isReactClassComponent,
    Stateful,
    StatefulElementHook,
    StatelessDecorReactHooks,
    StatelessElementHook,
    Wrapper
} from "./common";
import {decorReactFunc} from "./react-decor-function";
import {reactDecor} from "./logic";

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

export function elementHooks<S extends Stateful, P extends object>(onRootElement: Array<ElementHook<S, P>> | null, onEachElement: Array<ElementHook<S, P>> | null) {
    return {onRootElement, onEachElement};
}

export function onRootElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent(elementHooks([statelessHook], null), classHook ? elementHooks([classHook], null) : undefined);
}

export function onEachElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent(elementHooks(null, [statelessHook]), classHook ? elementHooks(null, [classHook]) : undefined);
}
