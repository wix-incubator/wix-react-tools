# merge-inline-style

merges this.props.style to the root element adding to the root node style  (the props overriding the root)
## API
adds style as optional paramater to component prop

## example

```jsx

class InnerComp extends BaseWithMergeInlineStyle<{},void>{
	render(){
		return <div style={{color:'red',background:'blue'}}></div>
	}
}

class OuterComp extends React.Component<void,void>{
	render(){
		return <InnerComp style={{color:'green',display:'inline'}}>
	}
}
//will render <div style="color:green;display:inline;background:blue;></div>
```
## Implementation

wraps the users render cloning the root element with the new style
