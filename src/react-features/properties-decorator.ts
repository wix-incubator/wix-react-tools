import {onRootElement, ElementArgs} from "../react-decor/react-decor-class";
import {Class, Rendered} from "../core/types";
import {ComponentProps, rootProps} from "./root-props";
import {Component} from "react";

const defaultWrapper = onRootElement((instance: Rendered<any>, args: ElementArgs<any>)=>{
    args.props = rootProps(instance.props, args.props);
    return args;
});

export function properties<T extends Rendered<any> = Rendered<any>>(clazz: Class<T>) : Class<T & Component<ComponentProps>>;
export function properties(blacklist: Array<string>) : <T extends object = Rendered<any>>(clazz: Class<T>) => Class<T & Component<ComponentProps>>;
export function properties<T extends Rendered<any>>(clazzOrBlacklist: Class<T> | Array<string>){
    if (typeof clazzOrBlacklist === 'function'){
        return defaultWrapper(clazzOrBlacklist as Class<T>);
    } else {
        return onRootElement((instance: Rendered<any>, args: ElementArgs<any>)=>{
            args.props = rootProps(instance.props, args.props, clazzOrBlacklist);
            return args;
        })
    }
}
