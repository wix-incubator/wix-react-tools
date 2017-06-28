# Languages mixin

allows working with language files. or other language service implementation.

in order to use this mixin you must manualy add a translateLangaugeKey method to the react context.

Future:
add a smartlink json language file by passing the url of the file to a util (loads sync server side, written into html source)

## API
  
**translateLangaugeKey(key:string)**

translates key according to current langauge,
usage:
```jsx
render(){
	return <div>{this.translateLangaugeKey('hello')}</div> 
}

```

## optional sugar:

optionaly you can set the mixin to be active in createElement and auto replace your strings between specific markers (% by default)
```jsx
render(){
	return <div>'%hello%'</div> 
}

```
optionaly you can set the mixin to pass a translation object straight to your render:
```jsx
render(lang){
	return <div>{lang.hello}</div> 
}
```
## Implementation

Add API to prototype:
* translateLangaugeKey- translates a key according to same named method in context

Optionally does work in create element and render (FUTURE) 
