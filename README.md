# Wix React Tools
 [![npm version](https://badge.fury.io/js/wix-react-tools.svg)](https://www.npmjs.com/package/wix-react-tools)
 [![Greenkeeper badge](https://badges.greenkeeper.io/wix/wix-react-tools.svg)](https://greenkeeper.io/)
 [![Build Status](https://travis-ci.org/wix/wix-react-tools.svg?branch=master)](https://travis-ci.org/wix/wix-react-tools)

> This library provides helpful utilities for creating React components.

## root function
Bridge between component's API and root element attributes.
Use this bridge in order to create components that are easily extendable in their usage, merging specific attributes passed as props onto the component's root element.

```tsx
function root<T, S>(componentProps:T, rootProps:S = {className:"root"}): T & S;
```

0. By default returns rootProps. An error will be thrown if rootProps does not contain a className attribute with string value.
1. data-* - Copy any attribute beginning with 'data-' from the componentProps to the result, overriding existing values
   1. data-automation-id - Merge (concat) the ids of componentProps and rootProps. Duplicate ids are not handled at the moment.
2. inline style - Merge the style attribute of componentProps and rootProps, in case of conflicting values, componentProps takes precedence
3. className - Merge (concat) the className attribute of componentProps and rootProps. Duplicate classes are not handled at the moment.

### Usage Example
```tsx
import { root } from "wix-react-tools";
...

<div {...root(props, {className:"foo bar"})} />
```

parent code:
```tsx
<Checkbox className="foo" data-foo="bar" style={{color:'black'}} />
```

Checkbox implementation :
```tsx
<div data-foo="123" {...root(props, {className:"root foo1" })} > ... </div>
```

rendered end result looks like this:
```tsx
<div data-foo="bar" className="foo root foo1"  style={{color:'black'}} > ... </div>
```

## merge Event Handlers
merge two event handlers into one. 
To avoid unnecessary render calls as a result of using this utility, this function is [memoized](https://en.wikipedia.org/wiki/Memoization), meaning calling it twice with the same arguments will produce the same result.
Its twin function, `chainFunctions`, has the same output, without using a cache layer. use it when the arguments of the function are not expected to be chained again.
```ts
function cachedChainFunctions<T extends Function>(first:T, last:T):T & {clear():void}
function chainFunctions<T extends Function>(first:T, last:T):T
```

## disposers
The `Disposers` class is helpful in keeping track of disposer functions, and clearing them when needed.
More details in [disposers](./docs/core/disposers.md)

## function-decor
Wrapping tools for functions
More details in [function-decor](./docs/function-decor)

## private-state
Privately extend any object, without inheritance or visibility concerns 
More details in [private-state](./docs/core/private-state.md)

## configuraiton
Static configuration allows passing any form of data/flags to tools.
More details in [config](./docs/core/config.md)

### Usage Example:

```ts
import { setGlobalConfig } from "wix-react-tools";

setGlobalConfig({ devMode: false }); //Defines devMode flags as false.  
```

### GlobalConfig
the type of configuration this project expects
The following are all of the project's flags: 

| flag    	| purpose                                                       	|
|---------	|---------------------------------------------------------------	|
| devMode 	| expose internals and show warnings to improve debugging 	|


# developer documentation

## how to build and test
 - clone the repository
 - in the cloned folder, run `npm install`
 - run `npm test` to build and test the code in both nodejs and browser

## how to debug (browser)
 - run `npm start` to run a development server
 - open `http://localhost:8080/webtest.bundle` to run live tests that will update while you change the source code

## how to contribute new features
1. open an issue describing the use-case for the feature. 
2. in that issue, explain how a user may solve the problem without the solution, describe the solution design, and the reasoning behind it.
3. after agreeing on a solution design, start a branch with [github reference](https://help.github.com/articles/autolinked-references-and-urls/) to the issue. 
4. add a markdown ("readme") description of the feature in the docs, containing the feature's description, user-code level examples, and API documentation of the feature.
5. write acceptance tests for the feature, including all the documented code examples. If strong typings are part of the feature's requirements, add tests in the `typings-checker` folder as well.
6. implement the feature, add tests as needed.
7. when the feature seems complete, open a pull request (PR)  with [github reference](https://help.github.com/articles/autolinked-references-and-urls/) to the issue.

## how to contribute bug fixes
The process is similar to that of new features, only the bar of explanations and documentations may be lower. start by opening an issue describing the bug.



