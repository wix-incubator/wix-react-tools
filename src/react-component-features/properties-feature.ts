import {ComponentProps, rootProps} from "./root-props";
import {ElementArgs} from "../react-decor/common";
import {makeRootOnly, reactDecor, ReactFeature} from "../react-decor/index";

function makeDecorator(blacklist?: Array<string>): ReactFeature<ComponentProps> {
    return reactDecor.makeFeature([makeRootOnly((props: any, args: ElementArgs<any>) => {
        args.newProps = rootProps(props, args.newProps, blacklist);
    })]);
}

function without(blacklist: Array<string>) {
    return makeDecorator(blacklist);
}

export type Properties = ReactFeature<ComponentProps> & {
    /**
     * black-list some of the props so that they are not copied automatically
     */
    without: (blacklist: Array<string>) => ReactFeature<ComponentProps>;
}

export namespace properties {
    /**
     * The type of props a decorated component should expect
     */
    export type Props = ComponentProps;
}
export const properties: Properties = makeDecorator() as Properties;
properties.without = without;
