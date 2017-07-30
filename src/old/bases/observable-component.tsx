import * as React from "react";
import {extendShallowObservable, observable, Reaction, runInAction} from "mobx";
import * as _ from "lodash";

export type ObserveFunc<C=any> = (this: C) => void;
type StringMap = { [key: string]: any };
let counters: { [key: string]: number } = {};

export function resetCounters() {
    counters = {};
}

export interface ComponentReactionMeta {
    name: string;
    observerFunc: ObserveFunc;
}

export interface ComponentReaction {
    name: string;
    observerFunc: ObserveFunc;
    reaction: Reaction;
}

export interface ObservableComponentClass<P, S> extends React.ComponentClass<P> {
    name: string;
    defaultState: S;
    watchesAllProps: boolean;
    __observingMethods__: ComponentReactionMeta[];
}

export interface ObservableComponentPrototype<P, S> {
    constructor: ObservableComponentClass<P, S>;
}

export class ObservableComponent<P, S> extends React.Component<P, S> {
    _originalProps: P;
    state: S;
    props: P;
    observableProps: P;
    observableState: S;
    _aboutToUpdate: boolean = false;
    _originalRender: () => React.ReactElement<any> | null | false;
    _renderReaction: Reaction;
    _lastRenderRes: React.ReactElement<any> | null | false;
    _componentReactions: ComponentReaction[];
    static watchesAllProps: boolean = false

    constructor(props: P, context?: any) {
        super(props, context);

        const anyThis: any = this;
        const cls = this.constructor as ObservableComponentClass<P, S>;
        const watchAllProps: boolean = cls.watchesAllProps;
        counters[cls.name] !== undefined ? counters[cls.name]++ : counters[cls.name] = 0;
        const rootNodeID = counters[cls.name];
        const thisName = cls.name + '#' + rootNodeID;

        this.observableProps = this.props && observable.shallowObject(this.props, thisName + '.props');
        this._originalProps = this.props;
        // this.props = this.observableProps;

        this.observableState = cls.defaultState && observable.shallowObject(cls.defaultState, thisName + '.state');
        this.state = this.observableState;

        //becoming observing
        this._originalRender = this.render;
        this._renderReaction = new Reaction(thisName + ' -> render', () => {
            React.Component.prototype.forceUpdate.call(this);
        })
        let isFirstRender: boolean = true;

        this.render = () => {
            this.props = this.observableProps;

            this._renderReaction.track(() => {
                this._lastRenderRes = this._originalRender();
            });
            //handling when decorator
            if (isFirstRender) {
                this._componentReactions && this._componentReactions.map((r: ComponentReaction) => {
                    r.reaction.track(r.observerFunc.bind(this))
                });
                isFirstRender = false;
            }
            //end when decorator
            return this._lastRenderRes;
        }
        //handling when decorator
        if (cls.__observingMethods__) {
            this._componentReactions = [];
            cls.__observingMethods__ && cls.__observingMethods__.map((m: ComponentReactionMeta) => {
                let reaction: Reaction;
                reaction = new Reaction(thisName + ' -> when:' + m.name, () => {
                    const res = anyThis[m.name]();
                    reaction && reaction.track(m.observerFunc.bind(this));
                    return res;
                })
                this._componentReactions.push({reaction, name: m.name, observerFunc: m.observerFunc});
            })
        }
        ;
        //end when decorator
    }

    shouldComponentUpdate() {
        return false;
    }

    componentWillReceiveProps(newProps: P) {
        const cls = this.constructor as ObservableComponentClass<P, S>;
        const watchAllProps: boolean = cls.watchesAllProps;
        let unWatchedProps: StringMap | undefined = undefined;
        runInAction(() => {
            _.forEach(newProps, (prop, propName: keyof P) => {
                const mobxManager: any = (this.observableProps as any).$mobx;
                if (cls.watchesAllProps && !mobxManager.values[propName]) {
                    unWatchedProps = unWatchedProps || {};
                    unWatchedProps[propName] = prop;
                } else {
                    this.observableProps[propName] = prop;
                }
            });
            this._originalProps = newProps;
            this.props = this.observableProps;
        });
        if (unWatchedProps) {
            extendShallowObservable(this.observableProps, unWatchedProps);
            this.forceUpdate();
        }

    }

    componentWillUnmount() {
        this._renderReaction && this._renderReaction.dispose();
        this._componentReactions && this._componentReactions.forEach(compReaction => compReaction.reaction.dispose())
    }


}


//ObservableComponentClass<P, S>
export function when<C extends ObservableComponent<any, any> = ObservableComponent<any, any>>(observerFunc: ObserveFunc<C>): (pr: any, methodName: string) => void {
    return (pr, methodName) => {
        const cls = pr.constructor;
        cls.__observingMethods__ = cls.__observingMethods__ || [];
        cls.__observingMethods__.push({
            name: methodName,
            observerFunc
        })
    }
}

