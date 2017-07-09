# preConstruct
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
```ts
function init(instance:Logger, constructorArguments){
    console.log('called on constructor with "'+constructorArguments[0]+'"');
}
 
@preConstruct(init)
class Logger{
  constructor(name:string){
    console.log('inited logger: '+name);
  }
}
```
calling `new Logger('MyLogger')` will print (by order):
 - `called on constructor with "MyLogger"`
 - `inited logger: MyLogger`
 
and return a new instance of the `Logger` class.
