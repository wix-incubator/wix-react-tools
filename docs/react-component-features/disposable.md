# Disposable feature
*stateful*

Helps manage clean-ups according to the life cycle of the component. 

Allows you to easily manage resources clean-ups by means of a [`Disposers`](../core/disposers.md) object that is bound to the component's lifecycle.

## API

### `disposable.This`
The signature of the class this feature enhances. It has but one field:
```ts
  readonly disposer: Disposers;
```

### `@disposable` feature
**requires decorated class to implement `disposable.This`**

Sets up `this.disposer` and takes care of clean-up when component unmounts.

#### example

Set up `JOB` to run 1 second after component mounts. `JOB` will be cancelled if the component un-mounts.

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
