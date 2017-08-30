# Wix React Tools
 [![npm version](https://badge.fury.io/js/wix-react-tools.svg)](https://www.npmjs.com/package/wix-react-tools)
 [![Greenkeeper badge](https://badges.greenkeeper.io/wix/wix-react-tools.svg)](https://greenkeeper.io/)
 [![Build Status](https://travis-ci.org/wix/wix-react-tools.svg?branch=master)](https://travis-ci.org/wix/wix-react-tools)

> This library provides helpful utilities for creating React components.

### Getting started

We begin by installing **wix-react-tools** as a dependency in our local project.

This can be done using npm:
```bash
npm install wix-react-tools --save
```

or using yarn:
```bash
yarn add wix-react-tools
```

Once the package is installed, we import the various utilities from the main entry point.

## **properties** decorator

Provides a bridge between the component's API and its root element's attributes.

Use this decorator in order to create components that are easily extendable in their usage, merging specific attributes passed as props onto the component's root element.

It merges the following props, with component props getting precedence:
- `className` - appended to existing className on the root
- `style` - shallowly merged into the root's style
- `data-automation-id` - appended to existing data-automation-id on the root
- other `data-*` - override the matching attributes on the root

### Usage Example

```ts
import * as React from 'react';

// import the decorator
import { properties } from 'wix-react-tools';

// TypeScript-specific:
// extend properties.Props so that the extendable props
// are in the component's interface.
// the decorator's type signature verifies these exists.
interface CompProps extends properties.Props {
    // ...
}

// apply the decorator on the component class
@properties
class Comp extends React.Component<CompProps> {
    render() {
        return (
            <div
                className="foo"
                style={{color: 'white', display: 'inline'}}
                data-automation-id="root"
            />
        );
    }
}
```
Users of `Comp` can now provide common props:
```tsx
<Comp className="bar" style={{color:'black'}} data-automation-id="comp" data-foo="bar" />
```

And the rendered result will contain the merged values:
```tsx
<div 
    className="foo bar"
    style="color: black; display: inline;"
    data-automation-id="root comp"
    data-foo="bar"
>
</div>
```

The `properties` decorator can also be applied on stateless functional components (SFCs):
```tsx
const Comp = properties<React.SFC<CompProps>>((props: CompProps) => {
    return (<div />);
});
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


