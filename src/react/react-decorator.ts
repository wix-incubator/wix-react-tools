import * as React from 'react';
import { Component, SFC, ComponentType, ComponentClass } from 'react';
import { ElementHook as ClassElementHook, onChildElement, onRootElement } from './react-decor-class';
import { Rendered, Class, isClass } from '../core/types';
import { isReactClassComponent, isNotEmptyArray } from './common';
import { decorReact as decorReactFunc, ElementHook as SFCElementHook, DecorReactHooks as SFCDecorReactHooks, SFCDecorator } from './react-decor-function'; // todo: fix exports in index

export type ClassProps<P extends object> = { props?: P };

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
    function classWrapper(comp: ComponentClass<P> & Class<T>) {
        let wrapper = comp;
        if (classHooks && isNotEmptyArray(classHooks.nodes)) {
            wrapper = classHooks.nodes.reduce(getHooker(onChildElement), wrapper);
        }
        if (classHooks && isNotEmptyArray(classHooks.root)) {
            wrapper = classHooks.root.reduce(getHooker(onRootElement), wrapper);
        }
        return wrapper;
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
