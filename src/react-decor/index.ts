export {decorReactClass} from "./react-decor-class";
export {DecorReactHooks, StatelessDecorReactHooks, StatefulElementHook, StatelessElementHook} from "./common";

import {Component, ComponentType} from "react";
import {decorReactClass} from "./react-decor-class";
import {DecorReactHooks, isReactClassComponent, StatelessDecorReactHooks} from "./common";
import {decorReactFunc} from "./react-decor-function"; // todo: fix exports in index

export type Wrapper<P extends object, T extends Component<P> = Component<P>> = <T1 extends ComponentType<P>>(comp: T1) => T1

export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>): Wrapper<P>;
export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks: DecorReactHooks<P, T>): Wrapper<P, T>;
export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): Wrapper<P, T> {
    const classDecorator = decorReactClass(classHooks || statelessHooks);
    const functionalDecorator = decorReactFunc(statelessHooks);

    // return wrapper with router built in
    function wrapper<T1 extends ComponentType<P>>(comp: T1): T1 {
        if (isReactClassComponent(comp)) {
            return classDecorator(comp as any) as T1;
        } else if (typeof comp === 'function') {
            return functionalDecorator(comp as any) as T1;
        }

        return comp;
    }

    return wrapper;
}
