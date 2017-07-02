# Mixin orchestrator

the mixin orchestrator adds middleware api to every class thus allowing a mixin to hook into any instance method.
the main use case is for mixins to customize react lifecycle methods in components.

middlewares applied to base classes can wrap methods of classes
inheriting from them.

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
# register for constructor:
register mixin callback to be called on instance creation.
the mixin recieves the arguments of the constructor.

## API

```ts
    function registerForConstructor<T,D extends object>(
                          targetClass:typeof T,
                          callback:   (instance:T,
                                    /* pluginInstanceData:D, if requested in options */
                                       ...constructorArguments:any[])=>any,
                          options?:Options);

 ```

 ## Example


 ```ts
 function mixin(cls:typeof Logger){
    registerForConstructor(cls,function(instance:Logger,...constructorArguments){
      console.log('called on constructor with "'+constructorArguments[0]+'"');
    })
 }

new Logger('MyLogger');
/*
will print:
called on constructor with "MyLogger";
inited logger: MyLogger
*/
```

# register middleware:

allows adding middlewares to methods, changing input and output.


## API

```ts
    function registerMiddleware<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          callback:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                       next:T[methodName],
                                       ...methodArguments:any[])=>any,
                          options?:Options);

 ```

 ## Example


 ```ts
 function mixin(cls:typeof Logger){
    registerMiddleware(cls,
                      'printMessage',
                      function(instance: Logger,
                               next: Logger.printMessage,
                               ...methodArguments){
      console.log('called on method with '+methodArguments[0]);
      const result:string = next('goodbye');
      console.log(result)
      return result
    });
 }

 const a = new Logger('MyLogger');
 //will print "inited logger: MyLogger"

 a.printMessage('hello');
 /*
 will return "message printed: goodbye"

 will print
 "called on method with hello"
 "goodbye"
 "message printed: goodbye"
 */

 ```



 # registerBefore, registerAfter
 registerBefore and registerAfter are a more performant way of creating mixins.

 by applying mixins before and after methods instead of wrapping them we get a shallower call stack, better performance and better debugablity

# registerBefore

registers a callback to be called before a class method is called

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
    function registerBefore<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          callback:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                       ...methodArguments:any[])=>[],
                          options?:Options);

 ```



# registerAfter

registers a callback to be after before a class method is called

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
- result: wrapped method return value


returns: modifed/original result to be returned from the wrapped method

```ts
    function registerAfter<T,D extends object>(
                          targetClass:typeof T,
                          methodName: string,
                          callback:   (instance:T,
                                    /* instancePluginData:D, if requested in options */
                                       ...methodArguments:any[])=>[],
                          options?:Options);

 ```

## Example

 ```ts
 function mixin(cls:typeof Logger){
    registerBefore(cls,'printMessage',function(instance:Logger,...methodArguments){
      console.log('called before method with '+methodArguments[0]);
      return ['goodbye']
    });
    registerAfter(cls,'printMessage',function(instance:Logger,methodReturn){
      console.log(methodReturn);
      return methodReturn
    });
 }

 const a = new Logger('inited');
 //will print "inited"

 a.printMessage('hello');
 /*
 will return "message printed: goodbye"

 will print
 "called on method with hello"
 "goodbye"
 "message printed: goodbye"
 */
```

# Options


 eager mode allows adding the middleware even if the method does not exist on the class
