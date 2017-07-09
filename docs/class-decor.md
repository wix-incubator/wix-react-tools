# Class Decor

The class decor API allows easily and efficiently hooking into any instance method. 
The main use case is to customize react lifecycle methods in class components.

Middlewares applied to base classes can wrap methods of classes inheriting from them.

the examples of the api below use the following user class:

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
# preConstruct:
register callback to be called on instance creation.
the callback receives the arguments of the constructor.

## API

arguments:
- hook: callback after constructor
- targetClass: class to modify

returns: the modified class

### hook method

arguments:
- instance: the new object whose constructor was just called
- constructorArguments: the arguments that were passed to the constructor

returns: void

### curry
The function is [curried](https://lodash.com/docs#curry), so it can be used as a decorator after applying all arguments except for the class.

```ts
    preConstruct<T extends object>(
        hook: ConstructorHook<T>): ClassDecorator<T>;
        
    preConstruct<T extends object>(
        hook: ConstructorHook<T>,
        target: Class<T>): Class<T>;
 ```

## Example

using this decorator:
 ```ts
 function mixin(cls:typeof Logger){
    preConstruct(function(instance:Logger, constructorArguments){
        console.log('called on constructor with "'+constructorArguments[0]+'"');
    }, cls)
 }
 ``` 
 or (equivalent):
  ```ts
  const mixin = preConstruct(function(instance:Logger, constructorArguments){
        console.log('called on constructor with "'+constructorArguments[0]+'"');
    });
  ```
with the `Logger` class as described above, will cause `new Logger('MyLogger')` to print:
```
called on constructor with "MyLogger";
inited logger: MyLogger
```

# middleware:

allows adding middlewares to methods, in order to control a method's:
 - Exception / error handling flow
 - global context of execution (i.e wrap the original method in `runInContext` or mobx [action](https://mobx.js.org/refguide/action.html))
 - filtering/implementation (a middleware may invoke a different business logic than the original method)

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
with the `Logger` class as described above, will cause `logger.printMessage('hello')` to print:
 - `"called on method with hello"`
 - `"goodbye"`
 - `"message printed: goodbye"`
 
and to return `"wrapped=> message printed: goodbye"`

 # before, after
 before and after are a more performant way of creating mixins.

 by applying mixins before and after methods instead of wrapping them we get a shallower call stack, better performance and better debugablity

# before

registers a callback to be called before a class method is called. callback must return an arguments array.

## API

arguments:
- targetClass: class to modify
- methodName:  name of method to modify
- callback:    callback to call before method execution
- options:     (optional) a mixer options object

returns: the modified class

### callback method

arguments:
- instance: the target class instance whos method is about to be called
- instancePluginData: a data object for plugin data associated with the instance (can be activated through the mixer options);
- methodArguments: the arguments to be passed to the method

returns: modified/original arguments to be passed to the method

```ts
    function before<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          callback:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                       ...methodArguments:any[])=>[],
                          options?:Options);

 ```



# after

registers a callback to be after a class method is called. callback return value will override method's return value.

## API

arguments:
- targetClass: class to modify
- methodName:  name of method to modify
- callback:    callback to call after method execution
- options:     (optional)a mixer options object

returns: the modified class

### callback method

arguments:
- instance: the target class instance whos method is about to be called
- instancePluginData: a data object for plugin data associated with the instance (can be activated through the mixer options);
- result: method return value


returns: modifed/original result

```ts
    function after<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          callback:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                       result:any)=>any,
                          options?:Options);

 ```

## Example

 ```ts
 function mixin(cls:typeof Logger){
    before(cls,'printMessage',function(instance:Logger,...methodArguments){
      console.log('called before method with '+methodArguments[0]);
      return ['goodbye']
    });
    after(cls,'printMessage',function(instance:Logger,methodReturn){
      console.log(methodReturn);
      return 'wrapped=> '+methodReturn;
    });
 }

 const a = new Logger('MyLogger');
 //will print "inited logger: MyLogger"

 a.printMessage('hello');
 /*
 will return "wrapped=> message printed: goodbye"

 will print
 "called on method with hello"
 "goodbye"
 "message printed: goodbye"
 */
```

# registerToProto

allows adding utility methods to class. this is done using the prototype and is the most performant option, it is unsuitable for lifecycle methods as it is overriden by methods with the same name on the class (or inheriting classes)


## API

arguments:
- targetClass: class to modify
- methodName:  name of method to add
- method:    method to add
- options:     (optional)a mixer options object

returns: the modified class

### method

arguments:
- instance: the target class instance who the method is called on
- instancePluginData: a data object for plugin data associated with the instance (can be activated through the mixer options);
- methodArguments: the arguments to be passed to the method


returns: modifed/original result

```ts
    function registerToProto<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          method:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                        ...methodArguments:any[])=>[])=>any,
                          options?:Options);

 ```

## Example

 ```ts
 @makeLogger
 class Logger(){
    printMessage:(...rest)=>void;
 }

 function makeLogger(cls:typeof object){
    registerToProto(cls,'printMessage',function(instance:object,...methodArguments){
      console.log(...methodArguments);
    });
 }

 const a = new Logger('MyLogger');

 a.printMessage('hello');
 /*
 will print
 "hello"
 */
```
