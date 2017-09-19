export {decorReactClass} from "./react-decor-class";
export {DecorReactHooks, StatelessDecorReactHooks, StatefulElementHook, StatelessElementHook, Wrapper} from "./common";

import {Component, ComponentType} from "react";
import {reflection} from "./react-decor-reflection";
import {decorReactClass} from "./react-decor-class";
import {DecorReactHooks, isReactClassComponent, StatelessDecorReactHooks, Wrapper} from "./common";
import {decorReactFunc} from "./react-decor-function";

const decorationReflection = reflection('react-decor-reflection');
export const { isDecorated } = decorationReflection;


export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>): Wrapper<P>;
export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks: DecorReactHooks<P, T>): Wrapper<P>;
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
decorationReflection.registerDecorator(Comp, Wrapped, wrapper);        return Wrapped;
    }

    return wrapper;
}
