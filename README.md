# wix react tools

This library exports different mixins for your react components and some curated base components using these mixins.
all mixins can be flagged disabled for a specific inheriting class

Each mixin provides:
* typescript interface to implement
* decorator to add implementation
* props interface

An options interface can be imported from {Options}.
## options api
** setStaticRendering(useStaticRendering:boolean):void **
sets the static render flag, when the static render flag is set to true, plugins will not activate event listeners/reactions

## available mixins:

[global-id](https://github.com/wixplosives/observable-component/blob/master/docs/global-id.md)

*Easily generate namespaced global DOM ID's that can be used in label for attribute and more*

[props-injection](https://github.com/wixplosives/observable-component/blob/master/docs/props-injection.md)

*allows injecting project resources directly into internal component props*

[copy-data-attributes](https://github.com/wixplosives/observable-component/blob/master/docs/copy-data-attributes.md)

*merge all data-\* attributes to the component root element*

[copy-aria](https://github.com/wixplosives/observable-component/blob/master/docs/copy-aria.md)

*merge all aria attributes to the component root element*

[merge-class-names](https://github.com/wixplosives/observable-component/blob/master/docs/merge-class-names.md)

*adds className prop to the component root element className*

[merge-inline-style](https://github.com/wixplosives/observable-component/blob/master/docs/merge-inline-style.md)

*merge inline style to the component root element style attribute*

[langauges](https://github.com/wixplosives/observable-component/blob/master/docs/langauges.md)

*allows easily using langauge files*

[disposable](https://github.com/wixplosives/observable-component/blob/master/docs/disposable.md)

*API to register for component unmount for destruct - centrelized dispose hook for mixins*

### events

[mouse-toucher](https://github.com/wixplosives/observable-component/blob/master/docs/mouse-toucher.md)

*automatically listens to the corresponding touch event when listening to a mouse event*

[safe-global-events](https://github.com/wixplosives/observable-component/blob/master/docs/safe-global-events.md)

*adds addGlobalEvent, setInterval, setTimout, requestAnimationFrame to the component prototype. added event listeners are safe to use in server and dispose automatically when component unmounts*

[on-click-outside](https://github.com/wixplosives/observable-component/blob/master/docs/on-click-outside.md)

*adds onClickOutside to prototype and props*



## 1st stage unsolved:

controled / uncontroled

we're looking for a mixin or pattern to make our components all controlled/uncontrolled according to the users choice


## 2nd stage:

dom ref

allows reference between sibling components (used for position floating UI extensions)


# available base components

ObserverComonent


# open discussions:

should we wrap create element using pragma annotation, globaly or during component render only?

should we wrap inheriting classes lifecycle methods at the constructor or require inheriting classes to call super.lifecycleMethod
