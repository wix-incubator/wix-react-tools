# stylable feature

*stateless*

This is a [Feature Factory](./README.md#Configurable-Features) which accepts a Stylable stylesheet.

The result feature applies the stylesheet to a component, Allowing it to use the stylesheet's class and state names natively.

### example

Given `style.st.css`:

```css
.root {
    -st-state:a,b;
}
.SomeClass {
    -st-state:x,y;
}
```

This component:

```tsx
import stylesheet from './style.st.css'

@stylable(stylesheet)
class Comp extends React.Component {
    render() {
        return <div style-state={{a: true, b: false}}>
            <div className="SomeClass External" style-state={{x: true, y: false}}/>
        </div>
    }
}
```

will function as expected.
