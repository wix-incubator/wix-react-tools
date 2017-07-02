# Disposable mixin

Helps manage clean-ups according to the life cycle of the component. 

## API
  
### Disposers utility class

Keeps track of bound resources by registering and executing [disposer](https://en.wikipedia.org/wiki/Dispose_pattern) functions.
A Disposers instance keeps track of functions by key.

**set(key:string, disposer:Function):void**

registers a disposer by key. If a previous disposer was registered under the same name, it is executed and removed.

```ts
const d = new Disposers();
d.set('printer', ()=>{console.log('foo');}); // prints nothing
d.set('amother printer', ()=>{console.log('foo2');}); // prints nothing
d.set('printer', ()=>{console.log('bar');}); // prints foo
```
**set(disposer:Function):string**

registers an anonymous disposer. Returns a random generated key that is affiliated with the disposer.

```ts
const d = new Disposers();
d.set(()=>{console.log('foo');}); // prints nothing
d.set(()=>{console.log('bar');}); // prints nothing
```

**dispose(key:string):void**

executes a disposer by key and removes it from memory.
```ts
const d = new Disposers();
d.set('printer', ()=>{console.log('foo');}); // prints nothing
d.dispose('printer'); // prints foo
d.dispose('printer'); // prints nothing
```
```ts
const d = new Disposers();
const key = d.set(()=>{console.log('foo');}); // prints nothing
d.dispose(key); // prints foo
d.dispose(key); // prints nothing
```
**disposeAll():void**
```ts
const d = new Disposers();
d.set('printer', ()=>{console.log('pre-foo');});
d.set('printer', ()=>{console.log('foo');}); // prints pre-foo
d.set('amother printer', ()=>{console.log('bar');}); 
d.set(()=>{console.log('baz');});
d.disposeAll() // prints foo, bar, baz
```

executes all registered disposers and removes them from memory.


### DisposeableCompMixin
```ts
 interface DisposeableCompMixin {
    readonly disposer: Disposers;
}
```

### @disposable decorator
**requires decorated class to implement DisposeableCompMixin**

Sets up this.disposer and takes care of clean-up when component unmounts;

#### example

set up `JOB` to run 1 second after component mounts. `JOB` will be cancelled if the component un-mounts.

```ts
const TIMER_KEY = "myTimer";
const JOB = () => {/* ... */};

resetTimer(){
	const timerId = setTimeout(JOB, 1000);
	this.disposer.set(TIMER_KEY, () => clearTimeout(timerId));
}
 
componentDidMount(){
    this.resetTimer();
}
```

cancel execution of `JOB` if it did not yet run
```ts
onClick(){
	this.disposer.dispose(TIMER_KEY);
}
```

cancel execution of `JOB` if it did not yet run, and set `JOB` to run 1 second after onClick
```ts
onClick(){
	this.resetTimer();
}
```


#### Under the hood
Initializes `this.disposer` with a new `Disposers` instance before `componentWillMount`.  
Calls `this.disposer.disposeAll()` after `componentWillUnmount`.

