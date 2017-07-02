# Mixin orchestrator

the mixin orchestrator adds middleware api to every class thus allowing a mixin to hook into any instance method.
the main use case is for mixin to customize react lifecycle methods in class components.


# Api
the examples of the api below use the following user class and mixin:



```ts
@mixin
class MyObj{
  multiply:(a:number,b:number)=>number;
  constructor(text:string){
    console.log(text);
  }
  printMessage(text:string){
    console.log(text);
    return 'message printed: '+text;
  }
}
```
# register for constructor:
register mixin callback to be called on instance creation; the mixin recieves the arguments of the constructor
 
 ```ts
 function mixin(cls:typeof MyObj){
    registerForConstructor(cls,function(instance:MyObj,...constructorArguments){
      console.log('called on constructor with '+constructorArguments[0]);
    })
 }
 
new MyObj('hello');
/*
will print:
called on constructor with hello;
hello
*/
```

# register middle ware:

allows adding middleware to methods, changing input and output
eager mode will work even when a method does not exist



 ```ts
 function mixin(cls:typeof MyObj){
    registerMiddleWare(cls,'printMessage',function(instance:MyObj,next,...methodArguments){
      console.log('called on method with '+methodArguments[0]);
      const result:string = next('goodbye');
      console.log(result)
      return result
    });
    registerMiddleWare(cls,'multiply',function(instance:MyObj,next,...methodArguments){
      return methodArguments[0] * methodArguments[1];
    },{eager:true});
 }
 
 const a = new MyObj('inited');
 //will print "inited"
 
 a.printMessage('hello');
 /*
 will return "message printed: goodbye"
 
 will print 
 "called on method with hello"
 "goodbye"
 "message printed: goodbye"
 */
 
 a.multiply(3,5);
 //will return 15, although not implemented in base class at all
 
 
 ```
 
 # registerBefore, registerAfter
 register before and after are a more performant way of creating mixins;
 
 

 ```ts
 function mixin(cls:typeof MyObj){
    registerBefore(cls,'printMessage',function(instance:MyObj,...methodArguments){
      console.log('called before method with '+methodArguments[0]);
      return ['goodbye']
    });
    registerAfter(cls,'printMessage',function(instance:MyObj,methodReturn){
      console.log(methodReturn);
      return methodReturn
    });
 }
 
 const a = new MyObj('inited');
 //will print "inited"
 
 a.printMessage('hello');
 /*
 will return "message printed: goodbye"
 
 will print 
 "called on method with hello"
 "goodbye"
 "message printed: goodbye"
 */
 
 
