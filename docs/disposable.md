# Disposable mixin

Registeration API for disposing of component which is called when component unmounts.

## API
  
**registerDisposer(disposer:() => any):() => any;**

registers a disposer to be called on unmount, 
returns a wrapped disposer that can be called for manual disposing

usage:
```jsx
componentDidMount(){
	const intervalId = setInterval(() => {/* ... */}, 50);
	this.registerDisposer(() => clearInterval(intervalId))    
}
```
manual dispose:
```jsx
componentDidMount(){
	const intervalId = setInterval(() => {/* ... */}, 50);
	this._manualDisposeInterval = this.registerDisposer(() => clearInterval(intervalId))    
}
onClick(){
	// manual dispose - will not be called again when component unmount
	this._manualDisposeInterval()
}
```

## Implementation

Add API to prototype:
* registerDisposer - accepts a function to be called when component unmounts and return hook to manually dispose

Wraps component instance methods on constructor:
* componentWillUnmount - call dispose hooks after user code
