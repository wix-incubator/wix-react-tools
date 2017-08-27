import * as React from 'react';
import { Component, SFC, ComponentType, ComponentClass } from 'react';
import { ElementHook as ClassElementHook, onChildElement, onRootElement } from './react-decor-class';
import { Class } from '../core/types';
import { isReactClassComponent, isNotEmptyArray, Rendered } from './common';
import { decorReact as decorReactFunc, ElementHook as SFCElementHook, DecorReactHooks as SFCDecorReactHooks, SFCDecorator } from './react-decor-function'; // todo: fix exports in index

export interface ClassDecorReactHooks<T extends Rendered<any>> {
    root?: Array<ClassElementHook<T>>;
    nodes?: Array<ClassElementHook<T>>;
}

function getHooker<P extends object, T extends Component<P>>(applyHook: typeof onChildElement | typeof onRootElement) {
    return function hook(res: ComponentClass<P> & Class<T>, hook: ClassElementHook<T>) {
        return applyHook(hook)(res);
    }
}

export function decorateReactComponent<P extends object, T extends Component<P> = Component<P>>(sfcHooks?: SFCDecorReactHooks<P>, classHooks?: ClassDecorReactHooks<T>) {
    function classWrapper(Comp: ComponentClass<P> & Class<T>) {
        if (classHooks && isNotEmptyArray(classHooks.nodes)) {
            Comp = classHooks.nodes.reduce(getHooker(onChildElement), Comp);
        }
        if (classHooks && isNotEmptyArray(classHooks.root)) {
            Comp = classHooks.root.reduce(getHooker(onRootElement), Comp);
        }
        return Comp;
    }

    function funcWrapper(sfc: SFC<P>) {
        return (sfcHooks && (isNotEmptyArray(sfcHooks.nodes) || isNotEmptyArray(sfcHooks.root))) ?
            decorReactFunc(sfcHooks)(sfc) :
            sfc;
    }

    // return wrapper with router built in
    function wrapper(comp: ComponentType<P>) {
        if (isReactClassComponent(comp)) {
            return classWrapper(comp as Class<T>);
        } else if (typeof comp === 'function') {
            return funcWrapper(comp);
        }
        return comp;
    }
    return wrapper;
}
