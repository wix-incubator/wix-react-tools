import {RuntimeStylesheet, Stylesheet} from "stylable";
import {decorateReactComponent} from "../react-decor/index";
import {ElementArgs, StatelessElementHook} from "../react-decor/common";

function eachElementHook(sheet: Stylesheet): StatelessElementHook<any> {
    function classNameMapper(name: string) {
        return sheet.get(name) || name;
    }

    return function stylableEachElementHook(_instance: never, _props: any, args: ElementArgs<any>): ElementArgs<any> {
        if (typeof args.elementProps.className === 'string') {
            args.elementProps.className = args.elementProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const {['style-state']: cssStates, ...rest} = args.elementProps;
        if (cssStates) {
            args.elementProps = {...rest, ...sheet.cssStates(cssStates)};
        }
        return args;
    }
}

function rootElementHook(sheet: Stylesheet) {
    return function stylableRootElementHook(_instance: never, _props: any, args: ElementArgs<any>): ElementArgs<any> {
        if (args.elementProps.className) {
            args.elementProps.className = sheet.get(sheet.root) + ' ' + args.elementProps.className;
        } else {
            args.elementProps.className = sheet.get(sheet.root);
        }
        return args;
    }
}

export const stylable = (sheet: RuntimeStylesheet) => decorateReactComponent({
    onEachElement: [eachElementHook(sheet.$stylesheet)],
    onRootElement: [rootElementHook(sheet.$stylesheet)]
});
