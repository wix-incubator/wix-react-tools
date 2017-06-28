import * as React from 'react';
import { expect, sinon, simulate, ClientRenderer } from 'test-drive-react';
import { ObservableComponent } from '../../src/bases/observable-component';
import { observable } from 'mobx';
// import { withGlobalId } from '../src/localToGlobalMixin'

const testAnchor: string = 'Test-root'


interface testProps {
    onRender?: (comp: any) => void;
    onMount?: (comp: any) => void;
}

// describe("Sanity", () => {
//     const clientRenderer = new ClientRenderer();
//     afterEach(() => clientRenderer.cleanup());


//     class MyBase<P, S> extends React.Component<P, S> {
//         baseMethod() { }
//     }


//     function withIdProps<C extends React.ComponentClass<P>,P>(cls:C):React.ComponentClass<P & {id:string}>{
//         return {} as any
//     }

//     const ClassWithIdProps = withIdProps(MyBase);


//     const ClassWithGlobalId = withGlobalId(MyBase);

//     interface props {
//         a: string
//     }
//     interface state {
//         b: number
//     }

//     class MyCompInternal extends ClassWithGlobalId<props, state> {

//         render() {
//             return <div>{this.getGlobalId('localId')}</div>
//         }

//         compMethod() { }
//     }

//     const MyComp = withIdProps(MyCompInternal)

//     it('Namespaces local ID with external ID', () => {
//         const { select, waitForDom } = clientRenderer.render(<MyComp a='str' id=''></MyComp>);

//         return
//     })
// })
