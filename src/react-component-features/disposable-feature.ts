import {Disposers} from "../core/disposers";
import {after} from "../functoin-decor";
import {classDecor} from "../class-decor";
import {privateState, StateProvider} from "../core/private-state";
import {chain} from "../core/functional";
import * as React from "react";

/**
 * designed for internal use of other features.
 * do not use without disposable feature otherwise disposers will not be cleaned up.
 */
export const privateDisposers: StateProvider<Disposers> = privateState('disposers', () => new Disposers());

export namespace disposable {
    /**
     * The type a decorated component should implement
     */
    export interface This extends React.Component {
        readonly disposer: Disposers;
    }
}

const hookUnmount = classDecor.method<React.Component>("componentWillUnmount",
    after(function (methodReturn) {
        if (privateDisposers.hasState(this)) {
            privateDisposers(this).disposeAll();
        }
        return methodReturn;
    }));

const addDisposerGetter = classDecor.defineProperties<any>({
    disposer: {
        get: function getDisposer(this: disposable.This) {
            return privateDisposers(this);
        }
    }
});

export const disposable = chain<disposable.This>(hookUnmount, addDisposerGetter);
