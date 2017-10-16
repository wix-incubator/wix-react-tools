import {cloneElement, Component, ComponentType, ReactElement, SFC} from "react";
import {DecorReacWrapArguments, isReactClassComponent, resetReactCreateElement} from "./common";
import {mergeOptionalArrays} from "../functoin-decor/common";
import {WrapApi} from "../wrappers/index";
import {context, makeCustomCreateElement, translateName} from "./react-decor-function";
import {decorFunction} from "../functoin-decor/index";
import {after, before, chain} from "../class-decor/index";
import React = require('react');

export function reactDecorMetadataMerge(md1: DecorReacWrapArguments<any>, md2: DecorReacWrapArguments<any>): DecorReacWrapArguments<any> {
    normalizeWrapArgs(md1);
    normalizeWrapArgs(md2);
    return {
        normalized: true,
        statelessHooks: {
            onRootElement: mergeOptionalArrays(md1.statelessHooks.onRootElement, md2.statelessHooks.onRootElement),
            onEachElement: mergeOptionalArrays(md1.statelessHooks.onEachElement, md2.statelessHooks.onEachElement)
        },
        classHooks: {
            onRootElement: mergeOptionalArrays(md1.classHooks.onRootElement, md2.classHooks.onRootElement),
            onEachElement: mergeOptionalArrays(md1.classHooks.onEachElement, md2.classHooks.onEachElement)
        }
    };
}

export function reactDecorWrapper<T extends ComponentType>(target: T, args: DecorReacWrapArguments<any>): T {
    let Wrapped = target;
    if (isReactClassComponent(target)) {
        Wrapped = classDecorator(target as any) as T;
    } else if (typeof target === 'function') {
        Wrapped = renderDecorator(target as any) as T;
    }
    return Wrapped;
}

function normalizeWrapArgs(wrapperArgs: DecorReacWrapArguments<any>){
    console.log('remove normalization!')
    if (!wrapperArgs.normalized) {
        if (wrapperArgs.statelessHooks.onEachElement && wrapperArgs.statelessHooks.onRootElement) {
            wrapperArgs.statelessHooks.onRootElement = wrapperArgs.statelessHooks.onEachElement.concat(wrapperArgs.statelessHooks.onRootElement);
        }
        if (wrapperArgs.classHooks.onEachElement && wrapperArgs.classHooks.onRootElement) {
            wrapperArgs.classHooks.onRootElement = wrapperArgs.classHooks.onEachElement.concat(wrapperArgs.classHooks.onRootElement);
        }
        wrapperArgs.normalized = true;
    }
}

class ReactWrapApi extends WrapApi<DecorReacWrapArguments<any>, ComponentType> {
    constructor(){
        super('react-decor', reactDecorWrapper, reactDecorMetadataMerge);
    }

    wrap<T extends ComponentType>(wrapperArgs: DecorReacWrapArguments<T>, wrapperSymbols: Function[], subj: T) : T {
        if (!wrapperArgs.normalized) {
            normalizeWrapArgs(wrapperArgs);
        }
        return super.wrap(wrapperArgs, wrapperSymbols, subj);
    }
}

export const reactDecor = new ReactWrapApi() as WrapApi<DecorReacWrapArguments<any>, ComponentType>;


const wrappedCreateElement = makeCustomCreateElement();

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
    if (metadata) {
        const hooks = isClass ? metadata.wrapperArgs.classHooks : metadata.wrapperArgs.statelessHooks;
        if (metadata && renderResult && context.hooks.onRootElement) {
            let rootElementArgs = context.createArgsMap.get(renderResult);
            if (rootElementArgs) {
                for (let i = 0; i < context.hooks.onRootElement.length; i++) {
                    rootElementArgs = context.hooks.onRootElement[i].call(context.componentInstance, context.componentProps, rootElementArgs)
                }
                renderResult = cloneElement(renderResult, (rootElementArgs!).elementProps, ...rootElementArgs!.children);
                context.createArgsMap.set(renderResult, rootElementArgs!);
            } else if (process.env.NODE_ENV !== 'production') {
                console.warn('unexpected root node : ', renderResult);
            }
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
