import {ComponentProps, rootProps} from "./root-props";
import {ElementArgs} from "../react-decor/common";
import {decorateReactComponent, elementHooks, Wrapper} from "../react-decor/index";


function makeDecorator(blacklist?: Array<string>): Wrapper<ComponentProps> {
    return decorateReactComponent(elementHooks([(props: any, args: ElementArgs<any>) => {
            args.elementProps = rootProps(props, args.elementProps, blacklist);
            return args;
        }], null ));
}

function without(blacklist: Array<string>) {
    return makeDecorator(blacklist);
}

export type Properties =  Wrapper<ComponentProps> & {
    /**
     * black-list some of the props so that they are not copied automatically
     */
    without: (blacklist: Array<string>) => Wrapper<ComponentProps>;
}

export namespace properties {
    /**
     * The type of props a decorated component should expect
     */
    export type Props = ComponentProps;
}
export const properties: Properties = makeDecorator() as Properties;
properties.without = without;
