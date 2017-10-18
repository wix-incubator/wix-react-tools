import {RuntimeStylesheet, Stylesheet} from "stylable";
import {decorateReactComponent} from "../react-decor/index";
import {decorationReflection} from "../react-decor/react-decor-reflection";
import {ElementArgs, StatelessElementHook, Wrapper} from "../react-decor/common";

function eachElementHook(sheet: Stylesheet): StatelessElementHook<any> {
    function classNameMapper(name: string) {
        return sheet.get(name) || name;
    }

    return function stylableEachElementHook(_props: any, args: ElementArgs<any>): ElementArgs<any> {
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
    return function stylableRootElementHook(_props: any, args: ElementArgs<any>): ElementArgs<any> {
        if (args.elementProps.className) {
            args.elementProps.className = sheet.get(sheet.root) + ' ' + args.elementProps.className;
        } else {
            args.elementProps.className = sheet.get(sheet.root);
        }
        return args;
    }
}

export const stylable = (sheet: RuntimeStylesheet):Wrapper<any> => {
    const wrapper = decorateReactComponent({
        onEachElement: [eachElementHook(sheet.$stylesheet)],
        onRootElement: [rootElementHook(sheet.$stylesheet)]
    });

    return (Comp: any) => {
        const Wrapped = wrapper(Comp);
        decorationReflection.registerDecorator(Comp, Wrapped, stylable);
        return Wrapped;
    }
};
