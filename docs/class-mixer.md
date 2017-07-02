# Class Mixer

the Mixer adds middleware api to every class thus allowing a mixin to hook into any instance method.
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


arguments:
- targetClass: class to modify
- callback:    callback after constructor
- options:     (optional) a mixer options object

returns: the modified class

### callback method

arguments:
- instance: the target class whos constructor was just called
- instancePluginData: a data object for plugin data associated with the instance (can be activated through the mixer options);
- constructorArguments: the arguments that were passed to the constructor

returns: void
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

arguments:
- targetClass: class to modify
- methodName:  name of method to wrap
- callback:    callback after constructor
- options:     (optional) a mixer options object

returns: the modified class

### callback method

arguments:
- instance: the target class whos constructor was just called
- instancePluginData: a data object for plugin data associated with the instance (can be activated through the mixer options);
- next: the unwrapped method (or a previous wrapping plugin)
- methodArguments: the arguments that were passed to the method

returns: void
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
      return 'wrapped=> '+result
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

registers a callback to be after a class method is called

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
    function registerAfter<T,D extends object>(
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
    registerBefore(cls,'printMessage',function(instance:Logger,...methodArguments){
      console.log('called before method with '+methodArguments[0]);
      return ['goodbye']
    });
    registerAfter(cls,'printMessage',function(instance:Logger,methodReturn){
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


# Mixin Options

## data key

allows mixins to store data for a mixed class instance

should be generated using generateKey

### example

```ts
import {registerBefore,registerAfter,generateKey} from 'class-mixer'


function logMethodPerf(methodName:string){
  return function(cls:typeof object){
    const mixinDataKey = generateKey('perfLogger');

    registerBefore(cls,
                   methodName,
                   function(instance:Logger,data,...methodArguments){
                      data.before = Date.now();
                      return methodArguments
                    },
                    {dataKey:mixinDataKey});


    registerAfter(cls,
                   methodName,
                   function(instance:Logger,data,result){
                      console.log(Data.now()-data.before)
                      return result
                    },
                    {dataKey:mixinDataKey});
  }

}


```



## eager mode
applies to: registerMiddleware, registerBefore, registerAfter

allows adding the middleware even if the method does not exist on the class

