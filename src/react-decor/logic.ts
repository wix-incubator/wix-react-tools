import {cloneElement, Component, ComponentType, ReactElement, SFC} from "react";
import React = require('react');
import {DecorReactHooks, isNotEmptyArrayLike, isReactClassComponent, resetReactCreateElement} from "./common";
import {mergeOptionalArrays} from "../functoin-decor/common";
import {WrapApi} from "../wrappers/index";
import {getHooksReducer, makeCustomCreateElement, context, translateName} from "./react-decor-function";
import {decorFunction} from "../functoin-decor/index";
import {chain, before, after} from "../class-decor/index";

export function reactDecorMetadataMerge(md1: DecorReactHooks<any>, md2: DecorReactHooks<any>): DecorReactHooks<any>{
    return {
        onRootElement : mergeOptionalArrays(md1.onRootElement, md2.onRootElement),
        onEachElement : mergeOptionalArrays(md1.onEachElement, md2.onEachElement),
    };
}

export function reactDecorWrapper<T extends ComponentType>(target: T, args: DecorReactHooks<any>) : T {
    let Wrapped = target;
    if (isReactClassComponent(target)) {
        debugger;
        Wrapped = classDecorator(target as any) as T;
    } else if (typeof target === 'function') {
        Wrapped = renderDecorator(target as any) as T;
    }
    return Wrapped;
}

export const reactDecor = new WrapApi<DecorReactHooks<any>, ComponentType>('react-decor', reactDecorWrapper, reactDecorMetadataMerge);

const wrappedCreateElement = makeCustomCreateElement();

function beforeRender(this: any, args: [object, any], wrapped:SFC): [object, any] {
    if (React.createElement !== wrappedCreateElement) {
        const metadata = reactDecor.getMetadata(wrapped);
        if (metadata) {
            context.createArgsMap.clear();
            context.hooks = metadata.wrapperArgs;
            context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
            React.createElement = wrappedCreateElement;
        } else {
            throw new Error('how comes no metadata?');
        }
    }
    return args;
}

function afterRender<P extends {}>(this: any, renderResult: ReactElement<P>, wrapped:SFC): ReactElement<P> {
    const metadata = reactDecor.getMetadata(wrapped);
    if (metadata && renderResult && isNotEmptyArrayLike(metadata.wrapperArgs.onRootElement)) {
        let rootElementArgs = context.createArgsMap.get(renderResult);
        if (rootElementArgs) {
            rootElementArgs = metadata.wrapperArgs.onRootElement.reduce(getHooksReducer(context.componentProps), rootElementArgs);
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
const renderDecorator =  process.env.NODE_ENV === 'production' ? rawRenderDecorator : translateName(rawRenderDecorator);

// TODO: implement?
const classDecorator = chain<Component>( before<Component>(beforeRender, 'render'), after<Component>(afterRender, 'render'));
