# merge-class-names

merges this.props.className to the root element adding to the root node className
## API
  adds className as optional paramater to component props

## example
```jsx

class InnerComp extends BaseWithMergeClassNames<{},void>{
	render(){
		return <div className="innerClass"></div>
	}
}

class OuterComp extends React.Component<void,void>{
	render(){
		return <InnerComp className="outerClass">
	}
}
//will render <div className="outerClass innerClass"></div>
```
## Implementation

wraps the users render cloning the root element with the new className
