# Wix React Tools

[![npm version](https://badge.fury.io/js/wix-react-tools.svg)](https://www.npmjs.com/package/wix-react-tools)
[![Greenkeeper badge](https://badges.greenkeeper.io/wix/wix-react-tools.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/wix/wix-react-tools.svg?branch=master)](https://travis-ci.org/wix/wix-react-tools)

This library provides helpful utilities and features for React components.

## Installation

Install **wix-react-tools** as a dependency in your local project.

Using npm:

```bash
npm install wix-react-tools --save
```

Using yarn:

```bash
yarn add wix-react-tools
```

## React Component Features

A React Component Feature is a function that takes a component and returns a component with all the characteristics of the original component, plus one or more new features.

More details in [React Component Features](./docs/react-component-features/README.md)

### properties feature

Connects some common component properties to the component's render output.

More details in [properties feature](./docs/react-component-features/properties.md)

### stylable feature

Applies a stylable stylesheet to a component, Allowing it to use the stylesheet's class and state names natively.

More details in [stylable feature](./docs/react-component-features/stylable.md)

### disposable feature

Helps manage clean-ups according to the lifecycle of the component.

More details in [disposable feature](./docs/react-component-features/disposable.md)

## decorateReactComponent

`decorateReactComponent` offers a way of applying hooks to React components in order to implement various features. These hooks temporarily [monkey-patch](https://en.wikipedia.org/wiki/Monkey_patch) `React.createElement`, `React.cloneElement`, and `cloneElement` (to be added soon) in order to customize every element created by your component. Further reading in [decorateReactComponent](./docs/react-decor/decorate-react-component.md)

## global ID

Produce unique ID values for react components
More details in [global ID](./docs/react-util/global-id.md)

## `chainFunctions`

Accept two function arguments.
Returns a new function that when executed calls the two functions, one after the other with the same arguments, and returns void.

### `chainFunctions.cached`

To avoid unnecessary render calls when using this utility to produce a property, the `cached` modifier is a [memoized](https://en.wikipedia.org/wiki/Memoization) version, meaning calling it twice with the same arguments will produce the same result.

```ts
function chainFunctions<T extends Function>(first:T, last:T):T
function chainFunctions.cached<T extends Function>(first:T, last:T):T & {clear():void}
```

## disposers

The `Disposers` class is helpful in keeping track of disposer functions and clearing them when needed.

More details in [disposers](./docs/core/disposers.md)

## function-decor

Wrapping library for functions.

More details in [function-decor](./docs/function-decor)

## class-decor

Hooks library for ES6 classes

More details in [class-decor](./docs/class-decor/README.md)

## private-state

Privately extend any object, without inheritance or visibility concerns.

More details in [private-state](./docs/core/private-state.md)

## configuration

Static configuration allows passing any form of data/flags to tools.

More details in [config](./docs/core/config.md)

## dev mode

Constant values to use for configuring development mode on or off, 
and synchronizes the [config](./docs/core/config.md)'s development flag with `process.env.NODE_ENV`.

More details in [dev mode](./docs/core/dev-mode.md)

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


