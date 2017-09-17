import {onGlobalConfig} from "./config";

//declare const process: {env: any} | undefined;
const _process = this['process'] || {env:{NODE_ENV : process.env.NODE_ENV}};
this['process'] = _process;

export const devMode = {
    ON : Object.freeze({
        devMode: true
    }),
    OFF : Object.freeze({
        devMode: false
    })
};

if (_process) {
    _process.env = _process.env || {};
    onGlobalConfig('devMode', (newVal: any) => {
        if (newVal) {
            _process.env.NODE_ENV = 'development';
        } else {
            _process.env.NODE_ENV = 'production';
        }
    });
}

export function getProcessEnv(){
    return _process.env;
}
