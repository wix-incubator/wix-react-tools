import {ElementArgs, onChildElement, onRootElement} from "../react/react-decor";
import {Rendered} from "../core/types";
import {chain} from "../class-decor/index";

function childElementHook<T extends Rendered<any>, P  = object>(instance: T, args: ElementArgs<P>):ElementArgs<P>{

    return args;
}

function rootElementHook<T extends Rendered<any>, P  = object>(instance: T, args: ElementArgs<P>):ElementArgs<P>{

    return args;
}

export const SBComponent = chain(onChildElement(childElementHook), onRootElement(rootElementHook));
