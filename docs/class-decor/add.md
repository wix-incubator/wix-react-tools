# add

add a utility method to a class. this is done using the prototype and is the most performant option, it is unsuitable for lifecycle methods as it is overriden by methods with the same name on the class (or inheriting classes).  

This is the best way to add traits to classes. 

## API

arguments:
- method: the method to add
- methodName:  name of method as it will appear in the class
- targetClass: class to modify

returns: the modified class

### method

arguments: defined by the method's logic

returns: the result of the method


```ts
function add<T extends object, P extends keyof T>(
    method: Function & T[P],
    methodName: P, c:Class<T>):Class<T>;
function add<T extends object, P extends keyof T>(
    method: Function & T[P],
    methodName: P):(c:Class<T>)=>Class<T>;
 ```

## Example

 ```ts
function printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
}

@add(printMessage, 'printMessage')
class Logger(){
    printMessage:(text:string)=>string;
}

const logger = new Logger();
```
calling `logger.printMessage('hello')` will print:
 - `"hello"`
 
and return `"message printed: hello"`
