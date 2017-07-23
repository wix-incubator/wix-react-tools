# after
register a callback to be after a class method is called. callback return value will override method's return value.

## API

arguments:
- hook: function to run after method execution
- methodName: name of method after which to hook
- targetClass: class to modify

returns: the modified class

### hook method

arguments:
- instance: the target class instance whose method was called
- methodResult: the last result of the method

returns: modified/original result to be passed to the caller

### curry
The function is [curried](https://lodash.com/docs#curry), so it can be used as a decorator after applying all arguments except for the class.

```ts
    function after<T extends object>(
        hook: <R=void>(instance:T, methodResult:R)=>R, 
        methodName: keyof T): ClassDecorator<T>;
 
    function before<T extends object>(
        hook: <R=void>(instance:T, methodResult:R)=>R, 
        methodName: keyof T, 
        target: Class<T>): Class<T>;
 ```

## Example

 ```ts
function postMethod(instance:Logger, methodReturn:string){
    console.log(methodReturn);
    return 'wrapped=> '+methodReturn;
}
  
@after(postMethod, 'printMessage')
class Logger{
  printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
  }
}
const logger = new Logger();
```
calling `logger.printMessage('hello')` will print (by order):
 - `"hello"`
 - `"message printed: hello"`
 
and to return `"wrapped=> message printed: hello"`
