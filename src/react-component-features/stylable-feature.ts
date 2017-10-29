import {RuntimeStylesheet} from "stylable";
import {makeReactDecoration, reactDecor} from "../react-decor/index";
import {ElementArgs} from "../react-decor/common";

export const stylable = reactDecor.makeFeatureFactory((sheet: RuntimeStylesheet) => {
    function classNameMapper(name: string) {
        return sheet.$stylesheet.get(name) || name;
    }

    function stylableElementHook(_props: any, args: ElementArgs<any>, isRoot: boolean){
        if (typeof args.newProps.className === 'string') {
            args.newProps.className = args.newProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const {['style-state']: cssStates, ...rest} = args.newProps;
        if (cssStates) {
            args.newProps = {...rest, ...sheet.$stylesheet.cssStates(cssStates)};
        }
        if (isRoot) {
            if (args.newProps.className) {
                args.newProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root) + ' ' + args.newProps.className;
            } else {
                args.newProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root);
            }
        }
    }

    return makeReactDecoration([stylableElementHook]);
});

reactDecor.forceFeatureOrder(stylable, reactDecor.onRootElement);
