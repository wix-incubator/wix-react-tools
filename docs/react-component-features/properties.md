# properties feature 
*stateless*

Connects some common component properties to the component's render output.

It merges the following fields from the component's properties into the root of the render result, 
with the component's properties getting precedence:
- `className` - appended to existing className
- `style` - shallowly merged into the root's style
- `data-automation-id` - append to existing data-automation-id
- `aria-label`, `aria-labelledby`, `aria-describedby` - override the matching attributes with provided properties
- `data-*` (any property starting with `data-`)- override the matching attributes with provided properties

Use this feature in order to create components that are easily extensible in their usage, merging specific attributes passed as props onto the component's render result.


## .without

While `properties` is an out-of-the-box ready-to-use feature, `properties.without` is a [Feature Factory](./README.md#Configurable-Features) which accepts an array of strings.

The result feature will behave exactly like the original properties feature, except it will ignore any attribute whose name matches one of the supplied strings.

note : `className` and `style` are never ignored.


## Usage Example

```ts
import * as React from 'react';
import { properties } from 'wix-react-tools';

// the decorator's type signature verifies these exists.
interface CompProps extends properties.Props {
    // ...
}

@properties.without('data-bar')
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
Users of `Comp` can provide aforementioned properties which will be applied to the component's render result:
```tsx
<Comp className="bar" style={{color:'black'}} data-automation-id="comp" data-foo="bar" data-bar="foo" />
```

And the render result will contain the merged values:
```tsx
<div 
    className="foo bar"
    style="color: black; display: inline;"
    data-automation-id="root comp"
    data-foo="bar"
>
</div>
```
