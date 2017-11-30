import {RuntimeStylesheet} from "stylable";
import {makeReactDecoration, reactDecor} from "../react-decor/index";
import {ElementArgs} from "../react-decor/common";
import {properties} from "./properties-feature";
import {featuresApi} from "../wrappers/index";
import {FeatureFactory, FeatureManager} from "../wrappers/feature-manager";
import {ComponentType, ReactElement} from "react";

export interface Fragment {
    (...args: any[]): ReactElement<any> | null;
}

function featureGenerator(isFragment: boolean, sheet: RuntimeStylesheet) {
    function classNameMapper(name: string) {
        return sheet.$stylesheet.get(name) || name;
    }

    function stylableElementHook(_props: any, args: ElementArgs<any>, isRoot: boolean) {
        if (typeof args.newProps.className === 'string') {
            args.newProps.className = args.newProps.className.split(' ').map(classNameMapper).join(' ');
        }
        const {['style-state']: cssStates, ...rest} = args.newProps;
        if (cssStates) {
            args.newProps = {...rest, ...sheet.$stylesheet.cssStates(cssStates)};
        }
        if (!isFragment && isRoot) {
            if (args.newProps.className) {
                args.newProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root) + ' ' + args.newProps.className;
            } else {
                args.newProps.className = sheet.$stylesheet.get(sheet.$stylesheet.root);
            }
        }
    }

    return makeReactDecoration([stylableElementHook]);
}

export type StylableFeature = FeatureFactory<ComponentType<any>, RuntimeStylesheet> & {
    fragment: FeatureFactory<ComponentType<any> | Fragment, RuntimeStylesheet>
}

export const stylable = reactDecor.makeFeatureFactory(featureGenerator.bind(null, false)) as StylableFeature;
featuresApi.forceFeatureOrder(stylable, reactDecor.onRootElement);
featuresApi.forceFeatureOrder(stylable, properties);

stylable.fragment = reactDecor.makeFeatureFactory(featureGenerator.bind(null, true));
FeatureManager.instance.featureMetadataProvider(stylable.fragment).symbols.push(stylable);
