import { Disposers } from "../utils/disposers";
import { ReactConstructor } from "../utils/types";
import { after, onInstance, chain } from "../utils/class-decor";
export interface DisposableCompMixin {
    readonly disposer: Disposers;
}

export const disposable = chain(
    after<any>((instance, methodReturn) => {
        (instance as any).disposer.disposeAll();
        return methodReturn;
    }, "componentWillUnmount"),
    onInstance(instance => {
        (instance as any).disposer = new Disposers();
    })
);

// draft of lazy optimization that will not override (=rename) class :
/*


 const prototypeDisposerProperty = {
 enumerable: true,
 configurable: false,
 get(this: DisposableCompMixin){
 Object.defineProperty(this, 'disposer', {
 enumerable: true,
 configurable: false,
 writable: false,
 value: new Disposers()
 });
 return this.disposer;
 }
 };

 function disposable2<T extends { new(...args: any[]): DisposableCompMixin & React.Component<any, any> }>(Class: T): T {
 Object.defineProperty(Class.prototype, 'disposer', prototypeDisposerProperty);
 const oldWillUnmount = Class.prototype.componentWillUnmount;
 Object.defineProperty(Class.prototype, 'componentWillUnmount', function (this: DisposableCompMixin) {
 oldWillUnmount && oldWillUnmount();
 if (Object.getOwnPropertyDescriptor(this, 'disposer')) {
 this.disposer.dispose();
 }
 });
 return Class;
 }
 */
