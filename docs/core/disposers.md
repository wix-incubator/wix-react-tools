### Disposers class API reference

The `Disposers` class is helpful in keeping track of disposer functions, and clearing them when needed.

**What's a disposer**

A [disposer](https://en.wikipedia.org/wiki/Dispose_pattern) is a function that takes no arguments, and frees one or more system resources when called the first time.
consider the following [code](https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_win_cleartimeout):
```ts
var myVar;
function myFunction() {
    myVar = setTimeout(function(){ alert("Hello"); }, 3000);
}
function myStopFunction() {
    clearTimeout(myVar);
}
```
The `myStopFunction` is a disposer as it takes no arguments, and clears the timer job the first time it is called. 


## Disposers class methods
**set(key:string, disposer:Function):void**

Registers a disposer by key. 
If a previous disposer was registered under the same key, it is executed and removed.

```ts
function disposer1(...){...}
function disposer2(...){...}
const d = new Disposers();
d.set('foo', disposer1);     // saves disposer1 as 'foo'       
d.set('bar', disposer1);     // saves disposer1 as 'bar'
d.set('foo', disposer2);     // saves disposer2 as 'foo', calls disposer1 (the previous 'foo')
// at this point there are two disposers registered: {foo: disposer2, bar:disposer1}
```
**set(disposer:Function):string**

Registers an anonymous disposer. Returns a unique key that identifies the disposer.

```ts
function disposer1(...){...}
function disposer2(...){...}

const d = new Disposers();
d.set(disposer1); // saves disposer1
d.set(disposer1); // saves disposer1
d.set(disposer2); // saves disposer2
// at this point there are three anonymous disposers registered: [disposer1, disposer1, disposer2]
```

**dispose(key:string):void**

Executes a disposer by key and removes it from memory.

```ts
function disposer1(...){...}
const d = new Disposers();
d.dispose('foo');           // does nothing
d.set('foo', disposer1);    // saves disposer1 as 'foo' 
// at this point there is one disposer registered: {foo: disposer1}
d.dispose('foo');           // clears the 'foo' disposer registration, calls disposer1 
// at this point there are no disposers registered: {}
d.dispose('foo');           // does nothing
```

```ts
function disposer1(...){...}
const d = new Disposers();
const key = d.set(disposer1); // saves disposer1
// at this point there is one disposer registered: [disposer1]
d.dispose(key);         // clears the previous disposer registration, calls disposer1 
// at this point there are no disposers registered: []
d.dispose(key);         // does nothing
```

**disposeAll():void**

Executes all registered disposers and removes them from memory.

```ts
function disposer1(...){...}
function disposer2(...){...}
function disposer3(...){...}
const d = new Disposers();
d.set('foo', disposer1);
d.set('bar', disposer2); 
d.set(disposer3);
// at this point there are three disposers registered: 1 anonymous and 2 named : 
[disposer3] & {foo: disposer1, bar:disposer2}
d.disposeAll()          // calls disposer1, disposer2, disposer3 
// at this point there are no disposers registered: [] & {}
```
Notice that `d.disposeAll.bind(d)` can itself be used as a disposer.
