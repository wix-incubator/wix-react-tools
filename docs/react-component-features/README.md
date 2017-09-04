# React Component Features

A React Component Feature is a function that takes a component and returns a component with all the characteristics of the original component, and one or more new features.

### Stateless and Stateful

Some Features can only be applied to Class Components, as they depend on lifecycle methods or state. These Features are called **Stateful Features**.  
Other Features can be applied to any React Component as they don't depend on state or lifecycle. These Features are called **Stateless Features**.

example:

```ts
import * as React from 'react';
import { statefulFeature, statelessFeature } from 'wix-react-tools';

// apply statefulFeature to a class component
@statefulFeature
class Comp1 extends React.Component {
    render() {
        return <div />;
    }
}

// apply statelessFeature to a class component 
@statelessFeature
class Comp2 extends React.Component {
    render() {
        return <div />;
    }
}

// apply statelessFeature to a stateless functional component
const functionalComponent = () => <div />;
const Comp3 = statelessFeature(functionalComponent); // this works fine

// this is an error : statefulFeature(functionalComponent); 
```

### Configurable Features

Some Features are exported directly (as in the example above), and some are exposed as **Feature Factories**, which are functions that produce Features. These are also called **Configurable Features**.

example:

```ts
import * as React from 'react';
import { configurableFeature } from 'wix-react-tools';

@configurableFeature('some configuration')
class Comp extends React.Component {
    render() {
        return <div />;
    }
}
```

### Feature Types 
*(Typescript specific)*

Some Features extend the API of the component. The most common example is an feature that adds new properties to a component. 
In order for the component's API to reflect these properties it has to declare them in the static signature of the original component 
(This overhead derives from [Typescript's support for mixins](https://www.typescriptlang.org/docs/handbook/mixins.html) and from lacking support for generic customization of function types).
Such features will set according demands from the provided component's type,
so that enhancing a component that does not declare the correct API will result in Typescript validation errors. 

By convention, `feature`s properties type will be exported under the its namespace as `feature.Props`.
 
example:
 
```ts
import * as React from 'react';
import { someFeature } from 'wix-react-tools';

interface Props extends someFeature.Props {
    name:string;
}

@someFeature
class Comp extends React.Component<Props> {
 render() {
     return <div>{this.props.name}</div>;
 }
}
```
