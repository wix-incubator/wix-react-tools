
# copy-aria


copies all aria-* attributes from the component props to the root node of the rendered component (overiding existing ones)
read: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
## API
  
adds all aria attributes to props

## example

```jsx

class SmartInputComp extends BaseWithCopyAria<{},void>{
	render(){
		return <input></input>
	}
}

class OuterComp extends React.Component<void,void>{
	render(){
		return <div>
				<SmartInputComp aria-describedby="Name-input"/>
				</div>
	}
}
/*
will render:
<div>
	<input aria-describedby="Name-input"/>
</div>
```

## Implementation

the implementation for copy aria wraps the render of every inheriting component, cloning its root element with the added/changed aria props

