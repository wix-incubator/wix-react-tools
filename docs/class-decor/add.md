# add

add public methods to a class (specifically the class'es prototype). 
A method added in this manner will be overridden by a method with the same name in the class or in an inheriting class.  

This is the preferred way to add traits to classes. 

## API

arguments:
- methods: an object containing the methods to add
- targetClass: class to modify

returns: the modified class

### methods
a plain object with string keys and function values.


```ts
function add<T extends {[k:string]:Function}>(mixin: T):<T1 extends T>(clazz:Class<T1>)=> Class<T1>;
function add<T extends {[k:string]:Function}, T1 extends T>(mixin: T, clazz:Class<T1>):Class<T1>;
 ```

## Example

 ```ts
function printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
}

@add({ printMessage })
class Logger{
    printMessage: (text:string)=>string;
}
const logger = new Logger();
```
calling `logger.printMessage('hello')` will print:
 - `"hello"`
 
and return `"message printed: hello"`
