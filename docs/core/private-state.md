# private-state

Privately extend any object, without inheritance or visibility concerns 

## Usage Example:

```ts
import {privateState} from 'wix-react-tools';

const getPrivate = privateState('secret key', ()=> {
    return {marked:false};
})

class A{   
    mark(){
        getPrivate(this).marked = true;
    }
    
    isMarked():boolean{
        return getPrivate(this).marked;
    }
}

let a = new A();
let b = new A();
a.mark();

console.log(a.isMarked());  // output: true;
console.log(b.isMarked());  // output: false;
```

## privateState

The `privateState` function creates a custom `StateProvider`, given a state initializer and a unique key.

## StateProvider
a function that provides a private, initialized state per given argument. 

### `.unsafe`
a sub-function, that only provides a state if one is already affiliated with the argument
If no such state is affiliated with the argument, it throws an error.

### `.hasState`
a sub-function, that returns true if and only if a state is already affiliated with the argument.
If no such state is affiliated with the argument, it returns false.

## Usage Example:

```ts
import {privateState} from 'wix-react-tools';

const getPrivate = privateState('secret key', ()=> {
    return {
        tags:[]
    };
})

class A{   
    mark(){
        getPrivate(this);
    }
    
    isMarked():boolean{
        return getPrivate.hasState(this);
    }
    
    tagMarked(tag:string){
       return getPrivate.unsafe(this).tags.push(tag);
    }
}

let a = new A();
let b = new A();
a.mark();

console.log(a.isMarked());  // output: true;
console.log(b.isMarked());  // output: false;

a.tag('foo'); // works
b.tag('foo'); // throws error!
```
