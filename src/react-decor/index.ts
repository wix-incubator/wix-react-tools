import {Component, ComponentType} from "react";
import {decorationReflection} from "./react-decor-reflection";
import {decorReactClass} from "./react-decor-class";
import {
    Stateful,
    DecorReactHooks, ElementHook, isReactClassComponent, StatefulElementHook, StatelessDecorReactHooks, StatelessElementHook,
    Wrapper
} from "./common";
import {decorReactFunc} from "./react-decor-function";

export {decorReactClass} from "./react-decor-class";
export {
    DecorReactHooks,
    StatelessDecorReactHooks,
    StatefulElementHook,
    StatelessElementHook,
    Wrapper,
    ElementArgs
} from "./common";

export const {isDecorated, getDecorated} = decorationReflection;

export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): Wrapper<P> {
    const classDecorator = decorReactClass(classHooks || statelessHooks);
    const functionalDecorator = decorReactFunc(statelessHooks);

    // return wrapper with router built in
    function wrapper<T1 extends ComponentType<P>>(Comp: T1): T1 {
        let Wrapped = Comp;

        if (isReactClassComponent(Comp)) {
            Wrapped = classDecorator(Comp as any) as T1;
        } else if (typeof Comp === 'function') {
            Wrapped = functionalDecorator(Comp as any) as T1;
        }

        decorationReflection.registerDecorator(Comp, Wrapped, wrapper);
        return Wrapped;
    }

    return wrapper;
}

export function elementHooks<S extends Stateful, P extends object>(onRootElement: Array<ElementHook<S,P>> | null, onEachElement: Array<ElementHook<S,P>> | null){
    return {onRootElement, onEachElement};
}

export function onRootElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent(elementHooks([statelessHook],  null), classHook ? elementHooks( [classHook],  null) : undefined);
}

export function onEachElement<P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>): Wrapper<P> {
    return decorateReactComponent(elementHooks(null, [statelessHook]) , classHook ? elementHooks( null, [classHook]) : undefined);
}
