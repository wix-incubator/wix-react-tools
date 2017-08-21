import {ElementArgs, onChildElement, onRootElement} from "../react/react-decor-class";
import {Rendered} from "../core/types";
import {chain} from "../class-decor/index";
import {Stylesheet} from "stylable";
import {__rest} from "tslib";


export interface StyleState{
    [key: string]: boolean;
}

// TODO data-temp is pending final name decision at https://github.com/wixplosives/stylable-components-guide/issues/24
const styleStatePropName = ['data-temp'];
type StylableProps = {
    className?: string;
    'data-temp'?:StyleState;
}

function childElementHook(sheet: Stylesheet) {
    function classNameMapper(name: string) {
        return sheet.get(name) || name;
    }
    return function SBComponentElement<T extends Rendered<any>, P extends StylableProps>(instance: T, args: ElementArgs<P>): ElementArgs<P> {
        if (typeof args.props.className === 'string') {
            args.props.className = args.props.className.split(' ').map(classNameMapper).join(' ');
        }
        if (typeof args.type === 'string' && args.props['data-temp']) {
            const otherProps = __rest(args.props, styleStatePropName);
            const cssStates = args.props['data-temp'];
            args.props = { ...sheet.cssStates(cssStates), ...otherProps };
        }
        return args;
    }
}

function rootElementHook(sheet: Stylesheet) {
    return function SBComponentRoot<T extends Rendered<any>, P extends StylableProps>(instance: T, args: ElementArgs<P>): ElementArgs<P> {
        args.props.className = sheet.get(sheet.root) + ' ' + args.props.className;
        return args;
    }
}

export const SBComponent = (sheet: Stylesheet) => chain(onChildElement(childElementHook(sheet)), onRootElement(rootElementHook(sheet)));
