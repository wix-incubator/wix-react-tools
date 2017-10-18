import {cloneElement, Component, ComponentType, ReactElement, SFC} from "react";
import {DecorReacWrapArguments, isReactClassComponent, resetReactCreateElement, translateName} from "./common";
import {InheritedWrapApi} from "../wrappers/index";
import {context, wrappedCreateElement} from "./monkey-patches";
import {decorFunction} from "../functoin-decor/index";
import {after, before} from "../class-decor/index";
import React = require('react');
import {chain} from "../core/functional";

export function reactDecorMetadataMerge(md1: DecorReacWrapArguments<any>, md2: DecorReacWrapArguments<any>): DecorReacWrapArguments<any> {
    return {
        statelessHooks: md1.statelessHooks.concat(md2.statelessHooks),
        classHooks: md1.classHooks.concat(md2.classHooks),
    };
}

export function reactDecorWrapper<T extends ComponentType>(target: T, _args: DecorReacWrapArguments<any>): T {
    let Wrapped = target;
    if (isReactClassComponent(target)) {
        Wrapped = classDecorator(target as any) as T;
    } else if (typeof target === 'function') {
        Wrapped = renderDecorator(target as any) as T;
    }
    return Wrapped;
}

export const reactDecor = new InheritedWrapApi<DecorReacWrapArguments<any>, ComponentType<any>>('react-decor', reactDecorWrapper, reactDecorMetadataMerge);

function beforeRender(this: any, args: [object, any], wrappedRender: Function): [object, any] {
    if (React.createElement !== wrappedCreateElement) {
        const isClass = this && this.render === wrappedRender;
        const metadata = reactDecor.getMetadata(isClass ? this.constructor : wrappedRender);
        if (metadata) {
            context.componentInstance = this;
            context.createArgsMap.clear();
            context.hooks = isClass ? metadata.wrapperArgs.classHooks : metadata.wrapperArgs.statelessHooks;
            context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
            React.createElement = wrappedCreateElement;
        } else {
            throw new Error('how comes no metadata?');
        }
    }
    return args;
}

function afterRender<P extends {}>(this: any, renderResult: ReactElement<P>, wrappedRender: SFC): ReactElement<P> {
    const isClass = this && this.render === wrappedRender;
    const metadata = reactDecor.getMetadata(isClass ? this.constructor : wrappedRender);
    if (metadata && renderResult && context.hooks) {
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

const rawRenderDecorator = decorFunction({
    before: [beforeRender],
    after: [afterRender]
});
// TODO class decor should accept a function wrapper
const rawCompClassDecorator = chain<Component>(
    before<Component>(beforeRender, 'render'),
    after<Component>(afterRender, 'render')
);
const renderDecorator = process.env.NODE_ENV === 'production' ? rawRenderDecorator : translateName(rawRenderDecorator);
const classDecorator = process.env.NODE_ENV === 'production' ? rawCompClassDecorator : translateName(rawCompClassDecorator);
