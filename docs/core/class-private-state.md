# class-private-state

Extend a class in a way that can be inherited by sub-classes, adding inheritance to the features of [private-state](private-state.md).

## Usage Example:

```ts
import {classPrivateState} from 'wix-react-tools';

const getPrivate = classPrivateState('secret key', ()=> {
    return {marked:false};
})
class A{   

}

class B extends A{   

}
let a = getPrivate(A);
let inheritedB = getPrivate.inherited(B);
console.log(a === inheritedB);  // output: true;
```

## classPrivateState
The `classPrivateState` function creates a custom `ClassStateProvider`, which extends [private-state](private-state.md)'s StateProvider`, with class inheritance.

## ClassStateProvider
a function that provides a private, initialized state per given class argument. Behaves exactly like `StateProvider`, 
and extends it by adding the following sub-functions for class traversing.

### `.inherited`
A sub-function, that provides the state affiliated with the supplied class.
If the supplied class was never initialized by this provider, it will provide the state of the closest initialized ancestor class.
If no ancestor is initialized, it will return null.

### `.inherited.unsafe` and `.unsafe.inherited`
A sub-function, that combines the features of both `.unsafe` and `.inherited`. 
It behaves like `.inherited`, but in cases when `.inherited` would have returned null, it will throw an error.

### `.inherited.origin` 
A sub-function, that provides the closest initialized ancestor class (including the class argument itself).
It behaves exactly like `.inherited`, except that instead of returning a state it returns the class with whom the state is afiliated.
In cases when `.inherited` would have returned null, It will also return null.
`.inherited.origin`  is a complete `StateProvider`, meaning it has all the sub-functions described in [private-state](private-state.md).

### `inherited.unsafe.origin` and `inherited.origin.unsafe`
It behaves like `.inherited.origin`, but in cases when `.inherited.origin` would have returned null, it will throw an error.
