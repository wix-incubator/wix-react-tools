# middleware

add a middleware to a method, in order to control a method's:
 - Exception / error handling flow
 - global context of execution (i.e wrap the original method in `runInContext` or mobx [action](https://mobx.js.org/refguide/action.html))
 - filtering/implementation (a middleware may invoke a different business logic than the original method)

Middlewares applied to base classes can wrap methods of classes inheriting from them.

## alternative: `before` and `after`
 - middlewares are simple but expensive. If you only need to hook / manipulate a method's input or output, use `before` / `after` hooks instead:
    - by using `before` and `after` instead of `middleware` you will get a shallower call stack, better performance and better debugablity
 - middlewares are only effective for synchronous methods. A purely a-synchronous method should be wrapped by hooking into its callback aregument or returned Promise/Stream/Iterator (using `before` or `after`, respectively).

## API

arguments:
- hook: middleware function
- methodName: name of method to wrap
- targetClass: class to modify

returns: the modified class

### middleware method

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
 ```ts
function logMW(instance: Logger, next: (n:string)=>string, methodArguments:[string]){
        console.log('called on method with '+methodArguments[0]);
        const result:string = next('goodbye');
        console.log(result)
        return 'wrapped=> '+result
}
  
@middleware(logMW, 'printMessage')
class Logger{
  printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
  }
}
const logger = new Logger();
```
calling `logger.printMessage('hello')` will print (by order):
 - `"called on method with hello"`
 - `"goodbye"`
 - `"message printed: goodbye"`
 
and return `"wrapped=> message printed: goodbye"`

## Inheriting decorated methods

Decorating class methods for inheritance has some notable edge cases, see [Inheriting decorated methods](inheriting-decorated-methods.md) for further details.
