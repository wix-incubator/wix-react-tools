# config
Generic global configuration allow passing data/flags to tools, either statically or for the duration of a specific task (e.g. a specific server side page render)

## setGlobalConfig
Merge the argument to the current config

## resetGlobalConfig
Completely replaces the current config. useful for tests etc.

## getGlobalConfig
Returns the current config (frozen)

## runInContext
Allows running code inside a global config sandbox.
any changes made to the config during the execution of the code will be reverted when it's done executing.
It receives a config argument to merge (see setGlobalConfig)

Use this function in your server-side rendering and tests

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
