import {Disposers} from "../utils/disposers";
import {ReactConstructor} from '../utils/types';
export interface DisposeableCompMixin {
    readonly disposer: Disposers;
}

export function disposable<T extends ReactConstructor<DisposeableCompMixin>>(Class: T): T {
    return class DisposeableComponent extends Class{
        constructor(...args:any[]){
            super(...args);
            (this as any).disposer = new Disposers();
            const oldWillUnmount = this.componentWillUnmount;
            this.componentWillUnmount = function componentWillUnmount(this: DisposeableCompMixin) {
                oldWillUnmount && oldWillUnmount();
                this.disposer.disposeAll();
            }
        }
    };
}

// draft of lazy optimization that will not override (=rename) class :
/*


 const prototypeDisposerProperty = {
 enumerable: true,
 configurable: false,
 get(this: DisposeableCompMixin){
 Object.defineProperty(this, 'disposer', {
 enumerable: true,
 configurable: false,
 writable: false,
 value: new Disposers()
 });
 return this.disposer;
 }
 };

 function disposable2<T extends { new(...args: any[]): DisposeableCompMixin & React.Component<any, any> }>(Class: T): T {
 Object.defineProperty(Class.prototype, 'disposer', prototypeDisposerProperty);
 const oldWillUnmount = Class.prototype.componentWillUnmount;
 Object.defineProperty(Class.prototype, 'componentWillUnmount', function (this: DisposeableCompMixin) {
 oldWillUnmount && oldWillUnmount();
 if (Object.getOwnPropertyDescriptor(this, 'disposer')) {
 this.disposer.dispose();
 }
 });
 return Class;
 }
 */
