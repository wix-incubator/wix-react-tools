import {cloneElement, ComponentType, ReactElement} from "react";
import {DecorReacWrapArguments, isReactClassComponent, resetReactCreateElement} from "./common";
import {Wrapper} from "../wrappers/index";
import {context, wrappedCreateElement} from "./monkey-patches";
import {functionDecor} from "../functoin-decor/index";
import {ReactDecor} from "./index";
import React = require('react');

export function reactDecorMetadataMerge(md1: DecorReacWrapArguments<any>, md2: DecorReacWrapArguments<any>): DecorReacWrapArguments<any> {
    return {
        statelessHooks: md1.statelessHooks.concat(md2.statelessHooks),
        classHooks: md1.classHooks.concat(md2.classHooks),
    };
}

export function reactDecorWrapper<T extends ComponentType>(this: ReactDecor, target: T, _args: DecorReacWrapArguments<any>): T {
    let Wrapped = target;
    if (isReactClassComponent(target)) {
        Wrapped = this.classComponentDecorator(target as any) as T;
    } else if (typeof target === 'function') {
        Wrapped = this.sfcDecorator(target as any) as T;
    }
    return Wrapped;
}


export function makeRenderWrapper(reactDecor: ReactDecor): Wrapper<Function> {
    function beforeRender(this: any, args: [object, any], wrappedRender: Function): [object, any] {
        if (React.createElement !== wrappedCreateElement) {
            const isClass = this && this.render === wrappedRender;
            const wrapperArgs = reactDecor.getWrapperArgs(isClass ? this.constructor : wrappedRender);
            if (wrapperArgs) {
                context.componentInstance = this;
                context.createArgsMap.clear();
                context.hooks = isClass ? wrapperArgs.classHooks : wrapperArgs.statelessHooks;
                context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
                React.createElement = wrappedCreateElement;
            } else {
                throw new Error('how comes no wrapperArgs?');
            }
        }
        return args;
    }

    function afterRender<P extends {}>(this: any, renderResult: ReactElement<P>): ReactElement<P> {
        if (renderResult && context.hooks) {
            let rootElementArgs = context.createArgsMap.get(renderResult);
            if (rootElementArgs) {
                for (let i = 0; i < context.hooks.length; i++) {
                    rootElementArgs = context.hooks[i].call(context.componentInstance, context.componentProps, rootElementArgs, true);
                }
                renderResult = cloneElement(renderResult, (rootElementArgs!).elementProps, ...rootElementArgs!.children);
                context.createArgsMap.set(renderResult, rootElementArgs!);
            } else if (process.env.NODE_ENV !== 'production') {
                console.warn('unexpected root node : ', renderResult);
            }
        }
        resetReactCreateElement();
        return renderResult;
    }

    return functionDecor.makeWrapper({
        before: [beforeRender],
        after: [afterRender]
    });
}
