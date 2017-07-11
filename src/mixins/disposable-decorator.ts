import { Disposers } from "../utils/disposers";
import {after, onInstance, chain} from "../utils/class-decor";
export interface DisposableCompMixin extends React.Component{
    readonly disposer: Disposers;
}

export const disposable = chain(
    after<DisposableCompMixin>((instance, methodReturn) => {
        instance.disposer.disposeAll();
        return methodReturn;
    }, "componentWillUnmount"),
    onInstance(instance => {
        (instance as any).disposer = new Disposers();
    })
);
