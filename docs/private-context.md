# private-context

private-context is a utility which lets you store instance related data, without inheritance concerns 

## Usage Example:

```ts
import {getPrivateContext} from 'react-bases';
const MY_KEY = "SomeKey";

class A{   
    mark(){
        getPrivateContext(this,MY_KEY).marked = true;
    }
    
    isMarked():boolean{
        return !!getPrivateContext(this,MY_KEY).marked;
    }
}

let a = new A();
let b = new A();
a.mark();

console.log(a.isMarked());  // output: true;
console.log(b.isMarked());  // output: false;
```


## getPrivateContext

The getPrivateContext function serves a private context object for a given instance of an object. It can be regarded as a global map,
whose keys are pairs of [instance,key], where instance is a reference to an instance of some object, and key is a string key

### arguments:

- targetObj: object on which to add private context to. Typically use "this".
- key: requested key inside private context - the key parameter gives the user a unique "private-context" which 

### returns
the requested private context object. This object is essentially an empty {} until it gets fields inserted into it
