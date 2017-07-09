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
will cause `new Logger('MyLogger')` to print:
```
called on constructor with "MyLogger";
inited logger: MyLogger
```
