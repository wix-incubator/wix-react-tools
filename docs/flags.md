# flags

This library uses [config](./config.md) to expose control over its behaviour. Defining a flag is easy:

## Usage Example:

```ts
import { FlagsContext,setGlobalConfig } from "react-bases";

setGlobalConfig<FlagsContext>({ devMode: false }); //Defines devMode flags as false.  
```


## Flags

The following are all of the project's flags: 

| flag    	| purpose                                                       	|
|---------	|---------------------------------------------------------------	|
| devMode 	| expose internal working and show warning to improve debugging 	|
