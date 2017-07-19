# React bases

 [![Greenkeeper badge](https://badges.greenkeeper.io/wix/react-bases.svg)](https://greenkeeper.io/)
 [![Build Status](https://travis-ci.org/wix/react-bases.svg?branch=master)](https://travis-ci.org/wix/react-bases)

> This library provides helpful utilities for creating React components.

## root function
Bridge between component's API and root element attributes.
Use this bridge in order to create components that are easily extendable in their usage, merging specific attributes passed as props onto the component's root element.


```tsx
function root<T, S>(componentProps:T, rootProps:S = {className:"root"}): T & S;
```

0. By default returns rootProps
1. data-* - Copy any attribute beginning with 'data-' from the componentProps to the result, overriding existing values
2. inline style - Merge the style attribute of componentProps and rootProps, in case of conflicting values, componentProps takes precedence
3. className - Merge (concat) the className attribute of componentProps and rootProps (removes duplicates). Will throw an error if rootProps does not contain a valid entry. Duplicate classes are not handled at the moment.
4. onClick outside - TBD, Pending Spec

### Usage Example
```tsx
<div {...root(props)} />
<div {...root(props, {className:"foo bar"})} />
```

parent code:
```tsx
<Checkbox className="foo" data-automation-id="bar" style={{color:'black'}} />
```

Checkbox implementation :
```tsx
<div data-automation-id="CHECKBOX"  {...root(props, {className:"root foo1" })} > ... </div>
```

rendered root end result looks like this:
```tsx
<div data-automation-id="bar" className="foo root foo1"  style={{color:'black'}} > ... </div>
```

# developer documentation
how to build and test:
 - clone the repository
 - in the cloned folder, run `npm install`
 - run `npm test` to build and test the code in both nodejs and browser

how to debug (browser):
 - run `npm start` to run a development server
 - open `http://localhost:8080/webtest.bundle` to run live tests that will update while you change the source code



