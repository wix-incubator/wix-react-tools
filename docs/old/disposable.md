# Disposable mixin

Helps manage clean-ups according to the life cycle of the component. 

Keeps track of bound resources by registering and executing [disposer](https://en.wikipedia.org/wiki/Dispose_pattern) functions. A `Disposers` instance keeps track of functions by key.

## API


### DisposableCompMixin
```ts
 interface DisposableCompMixin {
    readonly disposer: Disposers;
}
```

### @disposable decorator
**requires decorated class to implement DisposableCompMixin**

Sets up `this.disposer` and takes care of clean-up when component unmounts.

#### example

Set up `JOB` to run 1 second after component mounts. `JOB` will be cancelled if the component unmounts.

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

Cancel execution of `JOB` if it did not yet run.

```ts
onClick(){
	this.disposer.dispose(TIMER_KEY);
}
```

Cancel execution of `JOB` if it did not yet run, and set `JOB` to run 1 second after `onClick`.

```ts
onClick(){
	this.resetTimer();
}
```

#### Under the hood

Uses the `Disposers` utility class (described below).

Initializes `this.disposer` with a new `Disposers` instance before `componentWillMount`.  
Calls `this.disposer.disposeAll()` after `componentWillUnmount`.
