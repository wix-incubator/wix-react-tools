# Disposable mixin

Helps manage clean-ups during the life span of the component. 

## API
  
### Disposers utility class

Keeps track of bound resources by registering and executing [disposer](https://en.wikipedia.org/wiki/Dispose_pattern) functions.
A Disposers instance keeps track of functions by key.
**disposeAll():void**

executes all registered disposers and removes them from memory.

**set(key:string, disposer:Function):void**

registers a disposer by name. If a previous disposer was registered under the same name, it is executed and removed.

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

Initializes `this.disposer` with a new `Disposers` instance before `componentWillMount`.  
Calls `this.disposer.disposeAll()` after `componentWillUnmount`.

####usage

```ts
resetTimer(){
	const timerId = setTimeout(() => {/* ... */}, 500);
	this.disposer.set(TIMER_KEY, () => clearTimeout(timerId));
}
 
componentDidMount(){
    this.resetTimer();
}
```

manual dispose (will dispose old timer):
```ts
onClick(){
	this.disposer.dispose(TIMER_KEY);
}
```

manual renew (will dispose old timer and register the new one):
```ts
onClick(){
	this.resetTimer();
}
```

## Implementation
missing server-rendering test
