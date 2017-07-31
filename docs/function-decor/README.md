# Function Decor

The Function decor API allows easily and efficiently wrapping any function.
The main use case is to customize react functional components.

## Isn't that what Higher-Order Components are for?
Strictly speaking, [a higher-order component is a function that takes a component and returns a new component](https://facebook.github.io/react/docs/higher-order-components.html).
And this is what Function Decor is all about: you use it to make Higher-Order Components.
The common implementation of HOCs (including React's example) is a composition of two components, where the outer component returns a JSX expression containing the instructions for React to render the inner component. This model uses react's component render mechanism as the glue and contract between the outer and inner components.
Function Decor takes a different approach: It wraps the function itself with AOP-style hooks. This makes the result component seem like a single component to React.

## API

### before
register a callback to be called before a function is called. callback must return an arguments array.

#### Hook API
```ts
type BeforeHook<A extends THList, T = any> = (this: T, methodArguments: THListToTuple<A>) => THListToTuple<A>;
```

#### Example
Given a function:
```ts
const originalFunction = (name: string) => string;
```

Example before hook:
```ts
function beforeHook(methodArguments: [string]) {
    console.log('Mike ' + methodArguments[0]);
    return methodArguments;
}
```

Usage example:
```ts
const wrap = before(beforeHook); // creates the before hook
const printMessage = wrap(originalFunction); // wraps original function with our newly created hook

printMessage('Mike'); // prints 'Before Mike', returns 'Before Mike'
```

### after
register a callback to be called after a function is called. callback return value will override method's return value.

#### Hook API
```ts
export type AfterHook<R = void, T = any> = (this: T, methodResult: R) => R;
```

#### Example
Example after hook:
```ts
function afterHook(methodReturn: string) {
    console.log('After ' + methodArguments[0]);
    return methodArguments;
}

```

Usage example:
```ts
const wrap = after(afterHook);
const printMessage = wrap(originalFunction);

printMessage('Helen'); // prints 'After Helen', original function returns 'After Helen'
```

### middleware
Adding a middleware to a function allows:
 - Exception / error handling flow
 - global context of execution (i.e wrap the original method in `runInContext` or mobx [action](https://mobx.js.org/refguide/action.html))
 - filtering/implementation (a middleware may invoke a different business logic than the original method)

 #### Hook API
 ```ts
 type MiddlewareHook<A extends THList, R = void, T = any> = (this: T, next: (methodArguments: THListToTuple<A>) => R, methodArguments: THListToTuple<A>) => R;
 ```

#### Example
Example after hook:
```ts
function mwHook(next: (name: [string]) => string, methodArguments: [string]): string {
    let result = methodArguments[0] + '!'
    console.log('Here comes ' + result);
    result = next([result]); // calling the original function, which returns the same string
    console.log('There goes ' + result);
    return result;
}
```

Usage example:
```ts
const wrap = middleware(mwHook);
const printMessage = wrap(originalFunction);

printMessage('Bob'); // prints:
// 'Here comes Bob'
// 'There goes Bob'
// returns: 'Bob!' (! added)
```

### decorFunction

arguments:
- hooks: an object describing the hooks to apply to the function

returns: the wrapper function of type `<T extends Function>(func:T)=>T`

hooks argument:
before: an array of hooks to execute before the function is called
after: an array of hooks to execute after the function is called
middleware: an array of hooks to execute around the function

#### Example
> Note: The following example uses the hooks defined for the `before`, `after` and `middleware` above

```ts
const wrappers:HookWrappers = {
    middleware: [
        mwHook
    ],
    before: [
        beforeHook
    ],
    after: [
        afterHook
    ]
};

const enhanced = decorFunction(wrappers)(original);

const res = enhanced('Bob'); // prints:
// 'Before Bob'
// 'Here comes Bob!'
// 'Bob!'
// 'There goes Bob!'
// 'After Bob!'
```


