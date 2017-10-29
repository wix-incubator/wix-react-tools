import {Component, ComponentType, StatelessComponent} from "react";
import {
    DecorReactHooks,
    ElementArgs,
    ElementHook,
    isReactClassComponent,
    ReactDecoration,
    ReactFeature,
    Stateful,
    StatefulElementHook,
    StatelessDecorReactHooks,
    StatelessElementHook,
    translateName
} from "./common";
import {cloneFunction} from "../functoin-decor/index";
import {DecorClassApi} from "../wrappers/index";
import {classDecor, ClassFeature} from "../class-decor/index";
import {isArray} from "util";
import {makeRenderFeature} from "./logic";
import memoize = require('memoize-weak');

export {resetReactMonkeyPatches} from "./logic";
export {
    DecorReactHooks,
    StatelessDecorReactHooks,
    StatefulElementHook,
    StatelessElementHook,
    ReactFeature,
    ElementArgs,
    isComponentInstance,
    isReactClassComponent
} from "./common";


export class ReactDecor extends DecorClassApi<ReactDecoration<any>, ComponentType<any>> {

    static readonly instance = new ReactDecor();

    private sfcFeature: ReactFeature<StatelessComponent>;
    private classComponentFeature: ClassFeature<Component>;

    public readonly onRootElement : <P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>) => ReactFeature<P>;
    public readonly onEachElement : <P extends object, T extends Component<P> = Component<P>>(statelessHook: StatelessElementHook<P>, classHook?: StatefulElementHook<P, T>) => ReactFeature<P>;

    // singleton
    private constructor() {
        if (ReactDecor.instance) {
            return ReactDecor.instance;
        }
        super('react-decor');
        const renderWrapper = makeRenderFeature(this);
        this.sfcFeature = process.env.NODE_ENV === 'production' ? renderWrapper : translateName(renderWrapper);
        const rawCompClassFeature = classDecor.method<Component>('render', renderWrapper);
        this.classComponentFeature = process.env.NODE_ENV === 'production' ? rawCompClassFeature : translateName(rawCompClassFeature);
        this.onRootElement = this.makeFeatureFactory(
            (statelessHook: StatelessElementHook<any>, classHook?: StatefulElementHook<any>) =>
                makeReactDecoration([asRootOnly(statelessHook)], classHook && [asRootOnly(classHook)])
        );
        this.onEachElement = this.makeFeatureFactory(
            (statelessHook: StatelessElementHook<any>, classHook?: StatefulElementHook<any>) =>
                makeReactDecoration([statelessHook], classHook && [classHook])
        );
    }

    makeFeature<P extends object, T extends Component<P> = Component<P>>(wrapperArgs: ReactDecoration<P, T>): ReactFeature<P> ;

    makeFeature<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): ReactFeature<P> ;

    makeFeature<P extends object, T extends Component<P> = Component<P>>(statelessHooks: ReactDecoration<P, T> | StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): ReactFeature<P> {
        if (isArray(statelessHooks)) {
            return super.makeFeature(makeReactDecoration(statelessHooks, classHooks));
        } else {
            return super.makeFeature(statelessHooks);
        }
    }

    protected mergeDecorations(base: ReactDecoration<any>, addition: ReactDecoration<any>): ReactDecoration<any> {
        return {
            statelessHooks: base.statelessHooks.concat(addition.statelessHooks),
            classHooks: base.classHooks.concat(addition.classHooks),
        };
    }

    protected decorationLogic<T extends ComponentType>(this: ReactDecor, target: T, _args: ReactDecoration<any>): T {
        let Wrapped = target;
        if (isReactClassComponent(target)) {
            Wrapped = this.classComponentFeature(target as any) as T;
        } else if (typeof target === 'function') {
            Wrapped = this.sfcFeature(target as any) as T;
        }
        return Wrapped;
    }
}

export const reactDecor = ReactDecor.instance;

export function makeReactDecoration<P extends object, T extends Component<P> = Component<P>>(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P, T>): ReactDecoration<P, T> {
    return {
        statelessHooks: statelessHooks,
        classHooks: classHooks || statelessHooks
    };
}

export const asRootOnly = memoize(function asRootOnly<S extends Stateful, P extends object>(hook: ElementHook<S, P>): ElementHook<S, P> {
    return hook.rootOnly ? hook : makeRootOnly(cloneFunction(hook));
});

export function makeRootOnly<S extends Stateful, P extends object>(hook: ElementHook<S, P>): ElementHook<S, P> {
    hook.rootOnly = true;
    return hook;
}
