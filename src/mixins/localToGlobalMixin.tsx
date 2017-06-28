import * as React from 'react';
import {ReactConstructor} from '../utils/types';
// type Constructor<T extends React.Component<P, S>, P, S> = new (...args: any[]) => T;

// export function withGlobalId<TBase extends Constructor<C, P, S>, C extends React.Component<P, S>, P, S>(Base: TBase) {
//     return class extends Base {

//         getGlobalId(localId: string): string {
//             return localId;
//         };
//     }


// }




export interface localToGlobal{
    getGlobalId(localId: string): string
}


export function withGlobalId2<CBase extends ReactConstructor<localToGlobal>>(Base: CBase):CBase {
    return class extends Base {

        getGlobalId(localId: string): string {
            return localId;
        };

        moreProps: Map<any,any> = new Map<any,any>();
    }
}


// interface props {
//     a: string
// }
// interface state {
//     b: number
// }

class MyBase extends React.Component<any,any>{
    getGlobalId(localId: string): string {
        return '';
    };
}

class MyCompInternal extends MyBase {

    render() {
        return <div>{'lalalala'}</div>
    }

    compMethod() { }
}


const cls2 = withGlobalId2(MyCompInternal);
let g = new cls2();

// test:
// class MyComp extends id_ed<props,state> {
//     ggg() {

//     }
// }
// let b = new MyComp();
// b.ggg();
// b.submit();
// b.ddd();
//


// class MyComp extends id_ed<props,state> {
//     ggg() {

//     }
// }
// let b = new MyComp();
// b.ggg();
// b.submit();
// b.ddd();
