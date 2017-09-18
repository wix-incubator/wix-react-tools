import {onGlobalConfig, setGlobalConfig} from "./config";

declare const global: any;
declare const window: any;
declare let process: any;
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

if (process.env.NODE_ENV == 'production') {
    setGlobalConfig(devMode.OFF);
} else {
    setGlobalConfig(devMode.ON);
}

onGlobalConfig('devMode', (newVal: any) => {
    if (newVal) {
        process.env.NODE_ENV = 'development';
    } else {
        process.env.NODE_ENV = 'production';
    }
});
