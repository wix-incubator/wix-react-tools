import {Disposers} from "../core/disposers";
import {after, chain, defineProperties} from "../class-decor";
import {privateState, StateProvider} from "../core/private-state";

/**
 * designed for internal use of other features.
 * do not use without disposable feature otherwise disposers will not be cleaned up.
 */
export const privateDisposers: StateProvider<Disposers> = privateState('disposers', ()=> new Disposers());

export namespace disposable {
    /**
     * The type of instance a decorated component should expect
     */
    export interface Instance extends React.Component {
        readonly disposer: Disposers;
    }
}

export const disposable = chain<disposable.Instance>(
    after<disposable.Instance>((instance, methodReturn) => {
        if (privateDisposers.hasState(instance)){
            privateDisposers(instance).disposeAll();
        }
        return methodReturn;
    }, "componentWillUnmount"),
    defineProperties<any>({
        disposer: {
            get: function getDisposer(this: disposable.Instance) {
                return privateDisposers(this);
            }
        }
    })
);
