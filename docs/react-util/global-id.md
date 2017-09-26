# global ID

Produce unique ID values for react components

## `globalId.getRootId`
a function that returns the ID of either a Component instance or a properties object:

## given a Component instance

1. if `props.id` exists, resolved to `props.id`
2. else if this component was already assigned an ID by rule 3, resolved to pre-assigned ID. 
3. else produce new unique ID (using global counter), store it in the component and resolve to it.

## given a properties object
1. if `id` exists on argument, resolved to `id`
2. else throw an error

### usage

```tsx
import { globalId } from "wix-react-tools";

class MyComp extends React.Component{
...
    render () {
        <div id={globalId.getRootId(this)} >
            ...
        </ div>
    }
}
```
or: 
```tsx
function MyComp (p: globalId.Props){
    return <div id={globalId.getRootId(p)} >
       ...
    </ div>
}
```
## `globalId.getLocalId`
produce a new globally unique id for the child element (that is not the root of the render function), 
given an ID of the root element (assumed to be globally unique), 
and a locally unique id of a child element.

### usage
```tsx
import { globalId } from "wix-react-tools";

globalId.getLocalId(getRootId(p), 'title')
```tsx
function MyComp (p: globalId.Props){
    return <div id={globalId.getRootId(p)} >
       <div id={globalId.getLocalId(getRootId(p), 'inner_child')}>
    </ div>
}
```
