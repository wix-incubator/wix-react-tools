# before
register a callback to be called before a class method is called. callback must return an arguments array.

## API

arguments:
- hook: function to run before method execution
- methodName: name of method before which to hook
- targetClass: class to modify

returns: the modified class

### hook method

arguments:
- instance: the target class instance whose method is about to be called
- methodArguments: the arguments to be passed to the method

returns: modified/original arguments to be passed to the method

### curry
The function is [curried](https://lodash.com/docs#curry), so it can be used as a decorator after applying all arguments except for the class.

```ts
    function before<T extends object>(
        hook: <A extends Array<any>>(instance:T, methodArguments:A)=>A, 
        methodName: keyof T): ClassDecorator<T>;
 
    function before<T extends object>(
        hook: <A extends Array<any>>(instance:T, methodArguments:A)=>A, 
        methodName: keyof T, 
        target: Class<T>): Class<T>;
 ```

## Example

 ```ts
function preMethod(instance:Logger, methodArguments:[string]){
    console.log('called before method with '+methodArguments[0]);
    return ['goodbye'];
}
  
@before(preMethod, 'printMessage')
class Logger{
  printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
  }
}
const logger = new Logger();
```
calling `logger.printMessage('hello')` will print (by order):
 - `"called before method with hello"`
 - `"goodbye"`
 
and to return `"message printed: goodbye"`
