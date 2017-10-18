import {Disposers} from "../core/disposers";
import {after, chain, defineProperties} from "../class-decor";
import {privateState, StateProvider} from "../core/private-state";

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

export const disposable = chain<disposable.This>(
    after<disposable.This>(function (methodReturn) {
        if (privateDisposers.hasState(this)) {
            privateDisposers(this).disposeAll();
        }
        return methodReturn;
    }, "componentWillUnmount"),
    defineProperties<any>({
        disposer: {
            get: function getDisposer(this: disposable.This) {
                return privateDisposers(this);
            }
        }
    })
);
