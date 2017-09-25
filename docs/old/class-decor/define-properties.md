# defineProperties

define properties in a class. this is done by applying `Object.defineProperties` to the class' prototype, it is unsuitable for lifecycle methods as it is overriden by methods with the same name on the class (or inheriting classes).

This is the second best way to add traits to classes: while most use cases should use [add](../../class-decor/add.md),
