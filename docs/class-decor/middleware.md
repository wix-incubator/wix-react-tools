# middleware:

allows adding middlewares to methods, in order to control a method's:
 - Exception / error handling flow
 - global context of execution (i.e wrap the original method in `runInContext` or mobx [action](https://mobx.js.org/refguide/action.html))
 - filtering/implementation (a middleware may invoke a different business logic than the original method)

Middlewares applied to base classes can wrap methods of classes inheriting from them.


notes:
 - middlewares are expensive. If you only need to hook / manipulate a method's input or output, use the much more performant `before` / `after` hooks instead.
 - middlewares are only effective for synchronous methods. A purely a-synchronous method should be wrapped by hooking into its callback aregument or returned Promise/Stream/Iterator (using `before` or `after`, respectively).

## API

arguments:
- hook: callback after constructor
- methodName: name of method to wrap
- targetClass: class to modify

returns: the modified class

### callback method

arguments:
- instance: the new object whose constructor was just called
- next: the next implementation in the middleware chain
- methodArguments: the arguments that were passed to the method

return: the result of the method

### curry
The function is [curried](https://lodash.com/docs#curry), so it can be used as a decorator after applying all arguments except for the class.

```ts
    export function middleware<T extends object>(
        hook: MiddlewareHook<T, any, any>,
        methodName: keyof T): ClassDecorator<T>;

    export function middleware<T extends object>(
        hook: MiddlewareHook<T, any, any>,
        methodName: keyof T, target: Class<T>): Class<T>;
 ```

## Example
given this middleware:
 ```ts
function logMW(instance: Logger, next: Logger.printMessage, methodArguments){
        console.log('called on method with '+methodArguments[0]);
        const result:string = next('goodbye');
        console.log(result)
        return 'wrapped=> '+result
}
```
and using this decorator:
 ```ts
function mixin(cls:typeof Logger){
    return middleware(logMW, 'printMessage', cls);
}
 ```
 or (equivalent):
```ts
const mixin = middleware(logMW, 'printMessage');
```
with the following class:
```ts
@mixin
class Logger{
  constructor(name:string){
    console.log('inited logger: '+name);
  }
  printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
  }
}
```
will cause `logger.printMessage('hello')` to print:
 - `"called on method with hello"`
 - `"goodbye"`
 - `"message printed: goodbye"`
 
and to return `"wrapped=> message printed: goodbye"`
