import {ComponentProps, rootProps} from "./root-props";
import {ComponentType} from "react";
import {ElementArgs} from "../react-decor/common";
import {decorateReactComponent, Wrapper} from "../react-decor";


function makeDecorator(blacklist?:Array<string>){
    return decorateReactComponent({
        onRootElement: [(_instance: never, props: any, args: ElementArgs<any>) => {
            args.elementProps = rootProps(props, args.elementProps, blacklist);
            return args;
        }]
    });
}

const defaultWrapper = makeDecorator();

export function properties<T extends ComponentType<ComponentProps>>(comp: T): T;
export function properties(blacklist: Array<string>): Wrapper<ComponentProps>;
export function properties<P extends object>(clazzOrBlacklist: ComponentType<P> | Array<string>) {
    if (typeof clazzOrBlacklist === 'function') {
        return defaultWrapper(clazzOrBlacklist as ComponentType<P>);
    } else {
        return makeDecorator(clazzOrBlacklist);
    }
}
