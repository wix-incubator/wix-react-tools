import {chain} from "../class-decor/index";
import {RuntimeStylesheet, StateMap, Stylesheet} from "stylable";
import {__rest} from "tslib";
import {decorateReactComponent} from "../react-decor/index";
import {ElementArgs, StatelessElementHook} from "../react-decor/common";
import {Component} from "react";


// TODO data-temp is pending final name decision at https://github.com/wixplosives/stylable-components-guide/issues/24
const styleStatePropName = ['data-temp'];
type StylableProps = {
    className: string;
    'data-temp': StateMap;
}

function eachElementHook(sheet: Stylesheet) : StatelessElementHook<any>{
    function classNameMapper(name: string) {
        return sheet.get(name) || name;
    }

    return function stylableEachElementHook(_instance: never, _props:any, args: ElementArgs<any>): ElementArgs<any> {
        if (typeof args.elementProps.className === 'string') {
            args.elementProps.className = args.elementProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const cssStates = args.elementProps['data-temp'];
        if (cssStates) {
            const otherProps = __rest(args.elementProps, styleStatePropName);
            args.elementProps = {...sheet.cssStates(cssStates), ...otherProps};
        }
        return args;
    }
}

function rootElementHook(sheet: Stylesheet) {
    return function stylableRootElementHook(_instance: never, _props:any, args: ElementArgs<any>): ElementArgs<any> {
        args.elementProps.className = sheet.get(sheet.root) + ' ' + args.elementProps.className;
        return args;
    }
}

export const stylable = (sheet: RuntimeStylesheet) => decorateReactComponent({
    onEachElement: [eachElementHook(sheet.$stylesheet)],
    onRootElement: [rootElementHook(sheet.$stylesheet)]
});
