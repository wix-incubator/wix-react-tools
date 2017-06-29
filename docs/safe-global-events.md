# safe-global-events

adds safe (will not explode in server, will dispose on component unmount) versions of browser events

## API
**addWindowEvent(listener:(ev:React.Event)=>any):void** 
adds an event listener to the window object
**removeWindowEvent(listener:(ev:React.Event)=>any):void**
removes an event listener

**addBodyEvent(listener:(ev:React.Event)=>any):void** 
adds an event listener to the document.body object
**removeBodyEvent(listener:(ev:React.Event)=>any):void**
removes an event listener

**setTimeout(listener:()=>any,delay:number):number** //returns the timeout id for canceling it 
calls listener after a set amount of time
**clearTimeout(timeoutId:number)**
cancels timeout

**setInterval(listener:()=>any,interval:number):number** //returns the interval id for canceling it 
calls listener repeatedly every a set amount of time
**clearInterval(intervalId:number)**
cancels interval

## example
```jsx

interface ToggleCompState{
	counter:number;
}
class ToggleComp extends BaseWithMergeInlineStyle<{},ToggleCompState>{
	interval:number;
	componentWillMount(){
		this.state = {counter:0};
	}
	componentDidMount(){
		this.interval = this.setInterval(()=>{
			this.setState({counter:this.state.counter++})
		},100)
	}
	render(){
		return <div onClick={this.stop}>{this.state.counter}</div>
	}
	stop=()=>{
		this.clearInterval(this.interval)
   }
}

//will increase counter every 100ms, will stop counting when clicked
```
## Implementation

method implementations:
the methods check if they're running in server (or preferably in renderToString) if so, do nothing.
otherwise call browser equivalents

wraps users unmount and cleans attached listeners
