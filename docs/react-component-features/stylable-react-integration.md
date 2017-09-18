# Stylable React Integration

A React Component Feature is a function that takes a component and returns a component with all the characteristics of the original component, and one or more new features. By using the `stylable` [Feature Factory](./README.md#Configurable-Features) from **wix-react-tools**, you can integrate a **Stylable** stylesheet with a React component or a stateless functional component (SFC). The component can now use the stylesheet's class and state names natively.

Integrate the above Stylable stylesheet with a React component using the `@stylable` **Feature Factory**. The `stylable` Feature Factory, accepts a Stylable stylesheet, and produces a new feature that is applied to a component.

### Example Sytlable code

For the following examples, use the following Stylable code which is in a file named `style.st.css`:

```css
.root {
    -st-state:a,b;
}
.SomeClass {
    -st-state:x,y;
}
```

### Example Class Component with Decorator

Use a decorator to apply the stylesheet to a class component. This is equivalent to wrapping the class component with the Feature.

```ts
import * as React from 'react';
import {stylable} from 'wix-react-tools';
import stylesheet from './style.st.css';

// apply the Stylable stylesheet to a class component 
@stylable(stylesheet)
class Comp1 extends React.Component {
    render() {
        return <div style-state={{a: true, b: false}}>
            <div className="SomeClass External" style-state={{x: true, y: false}}/>
        </div>
    }
}
```

### Example Stateless Functional Component

Example applying the stylesheet to a stateless functional component (SFC). Wrapping the component creates a new component with the stylesheet.

```ts
import * as React from 'react';
import {stylable} from 'wix-react-tools';
import stylesheet from './style.st.css'

// declare a functional component
const functionalComponent = () => <div style-state={{a: true, b: false}}>
            <div className="SomeClass External" style-state={{x: true, y: false}}/>
        </div>;

// create a new component with stylesheet by wrapping with the stylable Feature
const Comp1a = stylable(stylesheet)(functionalComponent);
const Comp1b = (stylable(stylesheet))(functionalComponent); // the same, but more readable

// create a new component with stylesheet as above, but this time 
// by wrapping with a declared stylable wrapper
const wrapper = stylable(stylsheet); // wrapper to integrate stylesheet with any component
const Comp2 = wrapper(functionalComponent);  // create new component with stylesheet
```
