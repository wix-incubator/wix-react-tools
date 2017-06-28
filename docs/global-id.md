# Global ID Mixin

* Namespaces local ID for safe usage. 
* Namespaces are consistent and predictable. (For server rendering)


## API
  
**getGlobalID(localID: string):string;**

* If ID is provided to the component as prop, uses the provided
 ID as namespace for internal IDs.
* If ID is not provided, generates an ID based on the class name. 
    * Generated IDs are readable and predictable.
* The only Local ID parameter allowed when using getGlobalId in root node of the component is 'ROOT'. 
* If the ID of the root node is not used in the componenet, it does not need to be explicitly specified. 

### Usage Example

```js
export class MainClass extends BaseComp<void,void> {
    render() {
        return <div>
            <TestClass id={this.getGlobalID('MyTestComp')}></TestClass> 
            <label htmlFor={this.getGlobalID('MyTestComp')}></label>    
        </div>
    }
}
```
Generated IDs:
* htmlFor = MainClass0_MyTestComp
 
 ```js
export class TestClass extends BaseComp<void,void> {
    render() { 
        return <div>                                                           
            <input type="text" id={this.getGlobalID('MyInput')}/>       
            <label htmlFor={this.getGlobalID('MyInput')}></label>       
            <input type="text" id={this.getGlobalID('MyOtherInput')}/>  
            <label htmlFor={this.getGlobalID('MyOtherInput')}></label>  
        </div>
    }
}
```
Generated IDs:
* div: MainClass0_MyTestComp (implicit)
* input1: MainClass0_MyTestComp_MyInput
* label1: MainClass0_MyTestComp_MyInput
* input2: MainClass0_MyTestComp_MyOtherInput
* label2: MainClass0_MyTestComp_MyOtherInput     

### Usage Example in root node

```js
export class MainClass extends BaseComp<void,void> {
    render() {
        <div>
            <TestClass id={this.getGlobalID('MyTestComp')}></TestClass> 
            <label htmlFor={this.getGlobalID('MyTestComp')}></label>    
        </div>
    }
}
```
Generated IDs:
* id = MainClass0_MyTestComp
* htmlFor = MainClass0_MyTestComp

```js
export class TestClass extends BaseComp<void,void> {
    render() {
        <div id={this.getGlobalID('ROOT')}>                             
            <label htmlFor={this.getGlobalID('ROOT')}></label>          
        </div>
    }
}
```
Genereated IDs:
* id = MainClass0_MyTestComp
* htmlFor = MainClass0_MyTestComp


## optional createElement sugar

automatically name spaces string "id" and "forHtml" Attributes.

### usage example
```js
export class MainClass extends BaseCompWithGlobalIdSugar<void,void> {
    render() {
        <div>
            <TestClass id="MyTestComp"></TestClass> 
            <label htmlFor="MyTestComp")}></label>    
        </div>
    }
}
```

### note
create element sugar works by wrapping your render and supplying the component id to a createElement spoon

