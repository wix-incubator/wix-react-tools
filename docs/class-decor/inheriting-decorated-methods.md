# Inheriting decorated methods

class-decor decorations can be inherited and extended by sub-classes

example:
```ts

@before(beforeHook1, 'printMessage')
class Logger{
...
  printMessage(){
      // log implementation
  }
}

class Blogger extends Logger{
...
  printMessage(){
      // blog implementation
  }
}

@before(beforeHook2, 'printMessage')
class Vlogger extends Logger{
...
  printMessage(){
      // vlog implementation
  }
}

```
in the above example:
 - calling `new Logger().printMessage()` will run `beforeHook1` and then the log's implementation
 - calling `new Blogger().printMessage()` will run `beforeHook1` and then the blog's implementation
 - calling `new Vlogger().printMessage()` will run `beforeHook1`, then `beforeHook2` and then the vlog's implementation
 
 
## abstract method decorations 

Not only are method decorations inherited by sub-classes, 
they can even be defined on a class that does not implement the decorated method (known as 'abstract method decorations').
such use cases are especially helpful when providing a super-class with lifecycle hooks for init and destruction time, 
without counting on sub class'es implementation calling the `super` method.

### method stubbing
If a class with abstract method decoration is instantiated, 
a stub function will be used as the method's implementation, and decorated as if it was defined by the class author.
example:
```ts
@before(beforeHook1, 'printMessage')
class Logger{
 // notice no printMessage method!
}

class Blogger extends Logger{
...
  printMessage(){
      // blog implementation
  }
}
```
In the above example:
 - calling `new Logger().printMessage()` will run `beforeHook1` (rather than throwing a `printMessage is not a function` TypeError).
 - calling `new Blogger().printMessage()` will run `beforeHook1` and then the blog's implementation

### `.ifExists` modifier

To opt-out of method stubbing, use the `.ifExists` modifier in your abstract method decorator.

example:
```ts
@before.ifExists(beforeHook1, 'printMessage')
class Logger{
 // notice no printMessage method!
}

class Blogger extends Logger{
...
  printMessage(){
      // blog implementation
  }
}
```
In the above example:
 - calling `new Logger().printMessage()` will throw a `printMessage is not a function` TypeError.
 - calling `new Blogger().printMessage()` will run `beforeHook1` and then the blog's implementation

