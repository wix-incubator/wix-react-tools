# mixins

mixins allow modifying the behavior of classes/components

all mixins can be flagged disabled for a specific inheriting class

Each mixin provides:
* typescript interface to implement
* decorator to add implementation
* props interface

# how to use

```tsx
import {globalIdProps,globalIdInterface,globalId}

@globalId
class MyComp extends React.Component<globalIdProps & MyProps,any> implements globalIdInterface{
    getGlobalId(...rest):string{};
    render(){
        <div>
            <input id="nameInput"></input>
            <label forHtml="nameInput"></label>
        </div>
    }
}

React.render(<MyComp id="App"></MyComp>)

//will render:

<div>
    <input id="App-nameInput"></input>
    <label forHtml="App-nameInput"></label>
</div>
```

## available mixins:

[global-id](https://github.com/wix/react-bases/blob/master/docs/global-id.md)

*Easily generate namespaced global DOM ID's that can be used in label for attribute and more*

[props-injection](https://github.com/wix/react-bases/blob/master/docs/props-injection.md)

*allows injecting project resources directly into internal component props*

[copy-data-attributes](https://github.com/wix/react-bases/blob/master/docs/copy-data-attributes.md)

*merge all data-\* attributes to the component root element*

[copy-aria](https://github.com/wix/react-bases/blob/master/docs/copy-aria.md)

*merge all aria attributes to the component root element*

[merge-class-names](https://github.com/wix/react-bases/blob/master/docs/merge-class-names.md)

*adds className prop to the component root element className*

[merge-inline-style](https://github.com/wix/react-bases/blob/master/docs/merge-inline-style.md)

*merge inline style to the component root element style attribute*

[langauges](https://github.com/wix/react-bases/blob/master/docs/langauges.md)

*allows easily using langauge files*

[disposable](https://github.com/wix/react-bases/blob/master/docs/disposable.md)

*API to register for component unmount for destruct - centrelized dispose hook for mixins*

### events

[mouse-toucher](https://github.com/wix/react-bases/blob/master/docs/mouse-toucher.md)

*automatically listens to the corresponding touch event when listening to a mouse event*

[safe-global-events](https://github.com/wix/react-bases/blob/master/docs/safe-global-events.md)

*adds addGlobalEvent, setInterval, setTimout, requestAnimationFrame to the component prototype. added event listeners are safe to use in server and dispose automatically when component unmounts*

[on-click-outside](https://github.com/wix/react-bases/blob/master/docs/on-click-outside.md)

*adds onClickOutside to prototype and props*





## 1st stage unsolved:

controled / uncontroled

we're looking for a mixin or pattern to make our components all controlled/uncontrolled according to the users choice


## 2nd stage:

dom ref

allows reference between sibling components (used for position floating UI extensions)
