# observer-component

observer components utilize mobx in their props and state objects to avoid unessacery renders, to allow mobx features such as computed and reaction at the component level and to simplfy component writing syntax.


usage:


```js
import {ObserverComponent, when} from 'observable-component'

interface props {
    text:string;
}


interface state {
    textChanges:number;
}

class MyComp extends ObserverComponent<props,state>{
    //you must specify ALL the props you're gonna use so we can watch them
    static defaultProps:props = {
        text:'my default text'
    }

    //you must specify ALL the state fields you're gonna use so we can watch them
    static defaultState:state = {
        textChanges:0
    }

    render(){
        return <div>{this.props.text+' changes '+this.state.textChanges}</div>
    }

    //when allows us to react to specific property changes
    @when(()=>this.props.text)
    onTextChanged(){
        //as this is an observable state component, you should change your state directly
        this.state.textChanges++;
    }


}


```

