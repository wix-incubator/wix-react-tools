# defineProperties

define properties in a class (using `Object.defineProperties` on the class' prototype).
It is unsuitable for lifecycle methods as it is overriden by methods with the same name on the class (or inheriting classes).

This way of adding traits to classes is much slower than [add](add.md) but allows the widest verity of properties configuration.

## API

arguments:
- properties: an object containing the descriptors of the properties to add
- targetClass: class to modify

returns: the modified class

### properties (`TypedPropertyDescriptorMap`)
a plain object with string keys and `PropertyDescriptor` values.

```ts
function defineProperties<T extends object>(properties: TypedPropertyDescriptorMap<T>):<T1 extends T>(clazz:Class<T1>)=> Class<T1>;
function defineProperties<T extends object, T1 extends T>(properties: TypedPropertyDescriptorMap<T>, clazz:Class<T1>):Class<T1>;
 ```

## Example

 ```ts
function printMessage(text: string) {
    console.log(text);
    return 'message printed: ' + text;
}

@defineProperties({
    printMessage: {
        set: printMessage,
    }
})
class Logger {
    printMessage : string;
}
const logger = new Logger();
```
calling `logger.printMessage = 'hello'` will print:
 - `"hello"`
 
