import {onRootElement} from "../react-decor/react-decor-class";
import {Class} from "../core/types";
import {ComponentProps, rootProps} from "./root-props";
import {Component} from "react";
import {ElementArgs, Rendered} from "../react-decor/common";

const defaultWrapper = onRootElement((_instance: Rendered<any>, props:any, args: ElementArgs<any>)=>{
    args.elementProps = rootProps(props, args.elementProps);
    return args;
});

export function properties<T extends Rendered<any> = Rendered<any>>(clazz: Class<T>) : Class<T & Component<ComponentProps>>;
export function properties(blacklist: Array<string>) : <T extends object = Rendered<any>>(clazz: Class<T>) => Class<T & Component<ComponentProps>>;
export function properties<T extends Rendered<any>>(clazzOrBlacklist: Class<T> | Array<string>){
    if (typeof clazzOrBlacklist === 'function'){
        return defaultWrapper(clazzOrBlacklist as Class<T>);
    } else {
        return onRootElement((_instance: Rendered<any>, props:any, args: ElementArgs<any>)=>{
            args.elementProps = rootProps(props, args.elementProps, clazzOrBlacklist);
            return args;
        })
    }
}
