import {RuntimeStylesheet, StateMap, Stylesheet} from "stylable";
import {__rest} from "tslib";
import {decorateReactComponent} from "../react-decor/index";
import {ElementArgs, StatelessElementHook} from "../react-decor/common";

const STATE_ATTR_ARR = ['style-state'];

function eachElementHook(sheet: Stylesheet) : StatelessElementHook<any>{
    function classNameMapper(name: string) {
        return sheet.get(name) || name;
    }

    return function stylableEachElementHook(_instance: never, _props:any, args: ElementArgs<any>): ElementArgs<any> {
        if (typeof args.elementProps.className === 'string') {
            args.elementProps.className = args.elementProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const cssStates = args.elementProps['style-state'];
        if (cssStates) {
            const otherProps = __rest(args.elementProps, STATE_ATTR_ARR);
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
