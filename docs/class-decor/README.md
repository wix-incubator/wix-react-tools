# Class Decor

The class decor API allows easily and efficiently hooking into any instance method. 
The main use case is to customize react lifecycle methods in class components.

 - [onInstance](on-instance.md) - register callback to be called on instance creation
 - [add](add.md) - add a method to a class
 - [defineProperties](defineProperties.md) - define properties in a class's prototype

## function-decor support

Class-decor also supports [function-decor](../function-decor/README.md) functionality over class methods:
 - before - register a callback to be called before a class method is called
 - after - register a callback to be called before a class method is called
 - middleware - add a middleware to a method


### `.ifExists` modifier for method decorations
**missing documentation**


### Inheriting decorated methods

**missing documentation**
