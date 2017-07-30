import {Disposers} from "../../core/disposers";
import {after, chain, onInstance} from "../utils/class-decor";
export interface DisposableCompMixin extends React.Component {
    readonly disposer: Disposers;
}

export const disposable = chain<DisposableCompMixin>(
    after<DisposableCompMixin>((instance, methodReturn) => {
        instance.disposer.disposeAll();
        return methodReturn;
    }, "componentWillUnmount"),
    onInstance<any>(instance => {
        instance.disposer = new Disposers();
    })
);
