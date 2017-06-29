

// type Strict<T> = {
//     [P in keyof T]: T[P];
// }


// class BaseCompWithConfigurableProps<P ,S> extends React.Component<P,S>{
//     props:P;
//     props2:Strict<P>
//     constructor(props:P,context:any){
//         super(props,context)
//     }
//     render():JSX.Element{
//         return <div></div>
//     }
// }



// class MyComp extends BaseCompWithConfigurableProps<{a?:{b:string}},any>{
//     static defaultProps:{a:{b:{}}} = {a:{b:{}}}
//     render(){
//         this.props2.a.b
//         return <div></div>
//     }
// }

// <MyComp></MyComp>

// function decFac<T, S=T>(method:(this:T)=>any):(proto:T, methodName:string)=>void{
//     return function(proto:T,methodName:string){

//     }
// }

// type constructor1<T> ={
//     new():T;
// }

// function decFac2<T extends constructor1<I>,I instanceof T>(method:(this:I)=>any):(cls:T)=>void{
//     return function dec<T extends constructor1<I>,I>(cls:T){

//     }

// }


// class A{
//     @decFac(function(){this.prop})
//     prop:string
// }

