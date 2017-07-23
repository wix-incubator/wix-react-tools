# on-click-outside

allows listening to clicks outside the area of a component

## API
adds onClickOutside to allowed props for component.
adds onClickOutside, removeClickOutside to component prototype

**onClickOutside(listener:(ev:React.MouseEvent)=>void)**
adds an event listener, called when a click occurs outside the component
**removeClickOutside(listener:(ev:React.MouseEvent)=>void)**
removes an event listener


## example
```jsx

interface ToggleCompState{
	isOpen:boolean;
}
class ToggleComp extends BaseWithMergeInlineStyle<{},ToggleCompState>{
	render(){
		return <div onClick={this.open}>
					{
					this.state.isOpen? "open fir business" : 'closed'
					}
		</div>
	}
	open=()=>{
		this.setState({open:true});
		this.onClickOutside(this.close)ionn
   }
   close=()=>{
		this.setState({open:false});
		this.removeClickOutside(this.close)
   }
}

//will open when clicked, close when clicked outside
```
## Implementation

method implementation:
listens to click on document.body. checks if event target is child of listening component using document.comparePosition

props implementation:
wraps users render, calls the method to add or remove listeners as needed
