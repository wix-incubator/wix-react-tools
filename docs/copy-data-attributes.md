# copy-data-attributes

copies all data-* attributes from the component props to the root node of the rendered component (overiding existing ones)
## API
  
adds all data-* attributes to props

## example

```jsx

class SmartInputComp extends BaseWithCopyDataAttr<{},void>{
	render(){
		return <input></input>
	}
}

class OuterComp extends React.Component<void,void>{
	render(){
		return <div>
				<SmartInputComp data-automation-id="Name-input"/>
				</div>
	}
}
//will render <div>
				<input data-automation-id="Name-input"/>
			  </div>
```
## Implementation

the implementation for copy data attributes wraps the render of every inheriting component cloning its root node with the new/changed data-* props

