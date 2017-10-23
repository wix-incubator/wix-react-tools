import {cloneElement, ReactElement} from "react";
import {Feature} from "../wrappers/index";
import {context, resetReactMonkeyPatches, wrappedCreateElement, wrappedReactCloneElement} from "./monkey-patches";
import {functionDecor} from "../functoin-decor/index";
import {ReactDecor} from "./index";
import React = require('react');

export function makeRenderFeature(reactDecor: ReactDecor): Feature<Function> {
    function beforeRender(this: any, args: [object, any], wrappedRender: Function): [object, any] {
        if (React.createElement !== wrappedCreateElement) {
            const isClass = this && this.render === wrappedRender;
            const wrapperArgs = reactDecor.getDecoration(isClass ? this.constructor : wrappedRender);
            if (wrapperArgs) {
                context.componentInstance = this;
                context.createArgsMap.clear();
                context.hooks = isClass ? wrapperArgs.classHooks : wrapperArgs.statelessHooks;
                context.componentProps = args[0] || this.props; // args[0] for props in a functional react component
                React.createElement = wrappedCreateElement;
                React.cloneElement = wrappedReactCloneElement;
            } else {
                throw new Error('how comes no decoration?');
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
        resetReactMonkeyPatches();
        return renderResult;
    }

    return functionDecor.makeFeature({
        before: [beforeRender],
        after: [afterRender]
    });
}
