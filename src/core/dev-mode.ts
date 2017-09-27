import {onGlobalConfig, setGlobalConfig} from "./config";

declare const global: any;
declare const window: any;
declare let process: {env : {[k:string]: any}};

const globalCtx = (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global['global'] === global && global) || window;

globalCtx['process'] = process = globalCtx['process'] || process || {};
process.env = process.env || {};

export const devMode = {
    ON: Object.freeze({
        devMode: true
    }),
    OFF: Object.freeze({
        devMode: false
    })
};

// set global config's devMode flag according to environment
if (process.env.NODE_ENV === 'production') {
    setGlobalConfig(devMode.OFF);
}

if (process.env.NODE_ENV === 'development') {
    setGlobalConfig(devMode.ON);
}

// set process.env.NODE_ENV according to global config's devMode flag
onGlobalConfig('devMode', (newVal: any) => {
    if (newVal === false){
        process.env.NODE_ENV = 'production';
    } else {
        process.env.NODE_ENV = 'development';
    }
});
