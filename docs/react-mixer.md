# React Mixer

the ReactMixer adds middleware api to React.createElement,
overriding React.createElement for the duration of the render

## registerForCreateElement

allows registering a middlewares to modify React.createElement


## API


arguments:
- targetClass: class to modify createElement for
- middleware:    create element middleware
- options:     (optional) a mixer options object

returns: the modified class

### callback method

arguments:
- instance: the component whose render is now running
- type: the type of Element to be created
- props: the props of the Element to be created
- children: the children prop argument
- next: React.createElement or the next middleware

returns: void
```ts
    function registerForCreateElement<T,D extends object>(
                          targetClass:typeof T,
                          callback:   (instance:T,
                                    /* pluginInstanceData:D, if requested in options */
                                       type:React.Component | string,
                                       props:object,
                                       children:[],
                                       next:React.createElement)=>any,
                          options?:Options);

 ```

 ## Example


 ```tsx

 function namespaceIds(cls:React.ComponentClass){
    registerForCreateElement(cls,function(instance:React.Component<any,any>,type ,
    props, children, next){
      if(props.id){
          props.id =  instance.props.id + '-ns-' + props.className;
      }
      return next(type,props,children);
    })
 }

@namespaceIds
class MyComp extends React.Component<{className:string},{}>{
    render(){
        return <div id="root"></div>
    }
}

React.renderToString(<MyComp id="App"></MyComp>)

// will return <div id="App-ns-root"></div>
```


# Options

react mixer supports an additional option:

- applyOnlyToRoot - boolean, false by default. when true will only run on the root create element



 ## Example


 ```tsx

 function copyClassNamesToRoot(cls:React.ComponentClass){
    registerForCreateElement(cls,function(instance:React.Component<any,any>,type ,
    props, children, next){
      if(instance.props.className){
          props.className = instance.props.className + (props.className ? ' ' + props.className : '');
      }
      return next(type,props,children);
    },
    {applyOnlyToRoot:true})
 }

@copyClassNamesToRoot
class MyComp extends React.Component<{className:string},{}>{
    render(){
        return <div className="rootClassName">
                    <div className="otherClassName"></div>
               </div>
    }
}

React.renderToString(<MyComp className="App"></MyComp>)

// will return:
/* <div className="App rootClassName">
    <div className="otherClassName"></div>
</div>*/
```
