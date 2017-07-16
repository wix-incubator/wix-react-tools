# React bases

 [![Greenkeeper badge](https://badges.greenkeeper.io/wix/react-bases.svg)](https://greenkeeper.io/)
 [![Build Status](https://travis-ci.org/wix/react-bases.svg?branch=master)](https://travis-ci.org/wix/react-bases)

This library exports a class mixer,  react component mixins and several base -component falvors.



# how to install

```
npm install react-bases
```



# how to use

 - base components - built in baseComponents flavors
 - [mixins](./docs/mixins.md) - mixins to use to define your own case component
 - [class-decor](./docs/class-decor/README.md) - class decoration API
 - [react-mixer](./docs/react-mixer.md) - specific react mixin creation API
 - [config](./docs/config.md) - global and local config
 - [private-context](./docs/private-context.md) - private context per instance, per key
 - [flags](./docs/flags.md) - library flags and how to use them


# available base components

ObserverComonent

# developer documentation
how to build and test:
 - clone the repository
 - in the cloned folder, run `npm install`
 - run `npm test` to build and test the code in both nodejs and browser

how to debug (browser):
 - run `npm start` to run a development server
 - open `http://localhost:8080/webtest.bundle` to run live tests that will update while you change the source code
