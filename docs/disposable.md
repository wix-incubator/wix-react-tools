# Disposable mixin

Registeration API for disposing of component which is called when component unmounts.

## API
  
### Disposers class

**disposeAll():void**

executes all registered disposers and removes them from memory.

**set(key:string, disposer:Function):void**

registers a disposer by name. If a previous disposer was registered under the same name, it is executed.

**dispose(key:string):void**

executes  a disposer by name and removes it from memory.

### DisposeableCompMixin
```ts
 interface DisposeableCompMixin {
    readonly disposer: Disposers;
}
```

### @disposable decorator
**requires decorated class to implement DisposeableCompMixin**
initializes this.disposer and calls `this.disposer.disposeAll()` after `componentWillUnmount`;
 
usage:
```ts
componentDidMount(){
	const intervalId = setInterval(() => {/* ... */}, 50);
	this.disposer.set(MY_DISPOSE_NAME, () => clearInterval(intervalId))    
}
```

manual dispose:
```ts
onClick(){
	this.disposer.dispose(MY_DISPOSE_NAME);
}
```
## Implementation
missing server-rendering test
