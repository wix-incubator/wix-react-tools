# dev-mode

Constant values to use for configuring development mode on or off, 
and synchronizes the [config](./config.md)'s development flag with `process.env.NODE_ENV`

## `devMode.ON` and `devMode.OFF`

Designed to be used as arguments for [setGlobalConfig](./config.md#setGlobalConfig). 
Sets the development flag on or off.

## `process.env.NODE_ENV` two-way synchronization
Sets the development flag according the the value of `process.env.NODE_ENV` once, at module load time.

Also, sets the value of `process.env.NODE_ENV` whenever the development flag changes its value.
so It's safe to use `if(process.env.NODE_ENV === 'production')`

```ts
import {devMode, setGlobalConfig} from 'wix-react-tools';

setGlobalConfig(devMode.ON);
// now process.env.NODE_ENV === 'development'


setGlobalConfig(devMode.OFF);
// now process.env.NODE_ENV === 'production'

```
