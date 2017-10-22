import {RuntimeStylesheet} from "stylable";
import {makeReactDecoration, reactDecor} from "../react-decor/index";
import {ElementArgs} from "../react-decor/common";

export const stylable = reactDecor.makeFeatureFactory((sheet: RuntimeStylesheet) => {
    function classNameMapper(name: string) {
        return sheet.$stylesheet.get(name) || name;
    }

    function stylableElementHook(_props: any, args: ElementArgs<any>, isRoot: boolean): ElementArgs<any> {
        if (typeof args.elementProps.className === 'string') {
            args.elementProps.className = args.elementProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const {['style-state']: cssStates, ...rest} = args.elementProps;
        if (cssStates) {
            args.elementProps = {...rest, ...sheet.$stylesheet.cssStates(cssStates)};
        }
        if (isRoot) {
            if (args.elementProps.className) {
                args.elementProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root) + ' ' + args.elementProps.className;
            } else {
                args.elementProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root);
            }
        }
        return args;
    }

    return makeReactDecoration([stylableElementHook]);
});
