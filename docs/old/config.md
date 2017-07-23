# config

global and local config allow passing data/flags to mixins in a specific render context (e.g. a specific server side page render)

## standard configurations:
our mixins support the following flags:
- staticRendering: boolean -  when truthy, mixins will not activate event listeners/reactions
- dev: boolean - when truthy, expensive run-time code will run to validate usage of API in error-prone parts, and expose debug data  
- add your own cool config key here...



```ts
import {setGlobalConfig} from 'react-bases';

setGlobalConfig({staticRendering:true});
```


## setGlobalConfig
apply the argument to the current config

## resetGlobalConfig
completely replaces the current config. useful for tests etc.

## getGlobalConfig
returns the current config (frozen)

## runInContext
the runInConext method allows running code inside a global config sandbox.
any changes made to the config during the execution of the code will be reverted ehrn it's done executing.
It also receives a config argument to merge (see setGlobalConfig)

use this option in your server-side rendering and tests

```tsx
import {runInContext, setGlobalConfig} from 'react-bases';.

runInContext({staticRendering:true},()=>{
    React.renderToString(<div></div>)
});
// or (equivalent)
runInContext({},()=>{
    setGlobalConfig({staticRendering:true})
    React.renderToString(<div></div>)
});
```

### arguments:

- config: a config object to apply (see setGlobalConfig)
- method: the code to run in this context
- test: (optional) if set to true, and the method argument returns a promise, the context will remain active until the promise is resolved/rejected, you should use this only in tests.

