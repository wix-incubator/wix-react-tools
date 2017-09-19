# React Hooks API

This library offers a way of applying hooks to React components in order to implement various features. These hooks temporarily [monkey-patch](https://en.wikipedia.org/wiki/Monkey_patch) `React.createElement` and `React.cloneElement` (`cloneElement` handling to be added soon) in order to customize every element created by your component.

The API offers two types of hooks to choose from:

* `onEachElement` - Hook will be applied to each element created or cloned during your component's render its result replacing the resulting element
* `onRootElement` - Hook will be applied only to the resulting root node from your component's render and its result returned in its place, given that the root element was indeed created or cloned during your component's render

The type signatures for both `onEachElement` and `onRootElement` are identical.

The Hooks API can be applied to both stateless ([Stateless Functional Component](https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#stateless-functional-components)) and stateful ([ES6 class component](https://facebook.github.io/react/docs/state-and-lifecycle.html)) components. The inherent difference between the two (stateful and stateless) is reflected in their API below.

In order to implement a feature on top of react, you'll have to consider how it would be affected by the nature of the component it will be running on.

* Does it require an `onEachElement` or an `onRootElement` hook?
* Can it run on both stateless and stateful components, or does it always require state?
* How would executing your feature differ in implementation between the two?

Use the API reference and example below to help make sense of your requirements.

## Hook Type Signature

- `props` - the rendering component props (`P extends object`)
- `ElementArgs` - the arguments passed to that node's createElement

### Stateless Hook

The signature of a stateless hook:

```tsx
(props: P, args: ElementArgs<E>) => ElementArgs<E>
```

> Trying to access `this` inside of the hook returns `undefined`.

### Stateful Hook

The signature of a stateful hook:

```tsx
(this: Instance<T>, props: P, args: ElementArgs<E>) => ElementArgs<E>
```

> Stateful hooks are executed bound to the `this` of the component instance, and so have full access to the instance's members, private or otherwise (e.g. `this.state...`). This capability is only present on `class` based components.

### Unified Hook

The only difference between a stateful and a stateless hook is the `this` context with which they're executed (`undefined` for stateless, and the component instance for stateful). This is reflected in the following unified hook signature:

```tsx
(this: Instance<T>|undefined, props: P, args: ElementArgs<E>) => ElementArgs<E>
```

## decorateReactComponent API

`decorateReactComponent` allows the freedom of creating hooks separately for stateless and stateful components. Use it depending the requirements of your feature and components.

If the feature does not require state, then you can simply provide your hooks once (as the first argument, `stateless` in the interface) and the resulting wrapper, will be applicable to both SFC and Class based components.

If the feature requires a different implementation for SFC/Class components, provide those hooks separately.

```tsx
decorateReactComponent(statelessHooks: StatelessDecorReactHooks<P>, classHooks?: DecorReactHooks<P>): Wrapper<P>
```

```tsx
interface StatelessDecorReactHooks<P extends object> {
    onRootElement?: Array<StatelessElementHook<P>>;
    onEachElement?: Array<StatelessElementHook<P>>;
}
```

```tsx
interface DecorReactHooks<P extends object, T extends Component<P> = Component<P>> {
    onRootElement?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
    onEachElement?: Array<StatefulElementHook<P, T> | StatelessElementHook<P>>;
}
```

## onRootElement API

`onRootElement` is a sugar for when you only want to add a single hook to the root element of the component.

```tsx
onRootElement(statelessHook: StatelessElementHook, classHook?: StatefulElementHook): Wrapper {
```

## onEachElement API

`onEachElement` is a sugar for when you only want to add a single hook to every element of the component.

```tsx
onEachElement(statelessHook: StatelessElementHook, classHook?: StatefulElementHook): Wrapper {
```

## Examples

### Simple stateless hook

The following hook adds, changes (or adds if the property doesn't exist), and deletes a property. Running this hook on `onRootElement` will cause it to execute one time, only for the root node. Running it using `onEachElement` will have it run twice. You can see the results below.

### Creating a hook

#### `my-hook.tsx`

```ts
// the hook
export function myHook(componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        args.elementProps['data-add-me'] = componentProps.name;
        args.elementProps['data-change-me'] = componentProps.name;
        args.elementProps['data-delete-me'] = undefined;
        return args;
    }
```

#### `my-comp.tsx`

```tsx
import React from 'react';

// the expected props of the wrapped component
type PropsWithName = { name: string };

// Applicable SFC
export const MySFComp: React.SFC<PropsWithName> = ({name}) => (
        <div data-automation-id="root" data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span data-automation-id="content">
                {name}
            </span>
        </div>
    );

// Applicable class component
export class MyClassComp extends React.Component<PropsWithName, {}> {
    render() {
        return (<div data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span>
                {this.props.name}
            </span>
        </div>)
    }
}
```

### Creating a decorator from the hook

```tsx
import { decorateReactComponent } from 'wix-react-tools';
import { MySFComp, MyClassComp } from 'my-comp';
import { myHook } from 'my-hook';

// Create your decorator
const decorator = decorateReactComponent({ onEachElement: [myHook] });

/* In this case, our hook is stateless, and the resulting decorator is the same one we would have gotten by using decorateReactComponent({ onEachElement: [myHook] }, { onEachElement: [myHook] }) */

// Applying your decorator to an SFC
const DecoratedSFC = decorator(MySFComp);

// Applying your decorator to a class component
const DecoratedClassComp = decorator(MyClassComponent);

/* You can now use these decorated components as you would have any other component */

```

### Render result

Since the components (SFC and class based) in this example are identical in their functionality, and use the same `onEachElement` hook, they both render the same result.

> rendering with props: `name = 'Bob'`

```jsx
<div data-add-me="Bob" data-change-me="Bob">
    <span data-add-me="Bob" data-change-me="Bob">
        Bob
    </span>
</div>
```
