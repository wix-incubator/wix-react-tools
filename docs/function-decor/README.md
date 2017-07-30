# Function Decor

The Function decor API allows easily and efficiently wrapping any function. 
The main use case is to customize react functional components.

## Isn't that what Higher-Order Components are for?
Strictly speaking, [a higher-order component is a function that takes a component and returns a new component](https://facebook.github.io/react/docs/higher-order-components.html). 
And this is what Function Decor is all about: you use it to make Higher-Order Components. 
The common implementation of HOCs (including React's example) is a composition of two components, where the outer component returns a JSX expression containing the instructions for React to render the inner component. This model uses react's component render mechanism as the glue and contract between the outer and inner components.
Function Decor takes a different approach: It wraps the function itself with AOP-style hooks. This makes the result component seem like a single component to React. 

## API

arguments:
- hooks: an object describing the hooks to apply to the function

returns: the wrapper function of type `<T extends Function>(func:T)=>T`

hooks argument:
before: an array of hooks to execute before the function is called
after: an array of hooks to execute after the function is called
middleware: an array of hooks to execute around the function


