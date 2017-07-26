import {ReactConstructor} from "./utils/types";
import _map = require('lodash/map');
import _reduce = require('lodash/reduce');
import _forEachRight = require('lodash/forEachRight');
export type lifeCycleHookModifier = 'before' | 'after' //| 'around';;
export type lifeCycleRunnner<T> = (target: T) => void;
export type lifeCycleHookName = keyof lifeCycleHooks<any>;
export interface lifeCycleHook<T> {
    before?: lifeCycleRunnner<T>[];
    after?: lifeCycleRunnner<T>[];
}


export interface lifeCycleHooks<T> {
    render?: lifeCycleHook<T>;
    componentDidMount?: lifeCycleHook<T>;
    componentWillReceiveProps?: lifeCycleHook<T>;
    shouldComponentUpdate?: lifeCycleHook<T>;
    componentWillUpdate?: lifeCycleHook<T>;
    componentDidUpdate?: lifeCycleHook<T>;
    componentWillUnmount?: lifeCycleHook<T>;
}
const lifecycleHooks: lifeCycleHookName[] = ['render', 'componentDidMount', 'componentWillReceiveProps', 'shouldComponentUpdate', 'componentWillUpdate', 'componentDidUpdate', 'componentWillUnmount'];
const orchastratorSymbol: string = 'orchastratorSymbol'

export interface orchestratorMeta<T> {
    constructorHooks?: lifeCycleRunnner<T>[];
    lifeCycleHooks?: lifeCycleHooks<T>;
}

export class WithOrchestratorMetaCls<T> {
    orchastratorSymbol?: orchestratorMeta<T>
}

export type WithOrchestratorMeta<T> = T & WithOrchestratorMetaCls<T>;

const runLifeCycleHooks = {
    ..._reduce(lifecycleHooks, (accum: { [key: string]: Function }, hookName: lifeCycleHookName) => {
        accum[hookName] = function (...args: any[]) {
            const hooks = (this.constructor as WithOrchestratorMeta<any>).orchastratorSymbol.lifeCycleHooks[hookName];
            if (hooks.before) {
                hooks.before.forEach(function (this: any, hook: Function) {
                    hook(this, ...args);
                });
            }
            const res = (this as any)['_original_' + hookName](...args);

            if (hooks.after) {
                _forEachRight(hooks.after, function (this: any, hook: Function) {
                    hook(this, ...args);
                });
            }
            return res;
        }
        return accum
    }, {})

}


function activateMixins<T>(target: any) {
    if (target.constructor && target.constructor.orchastratorSymbol) {
        target.constructor.orchastratorSymbol.constructorHooks && target.constructor.orchastratorSymbol.constructorHooks.forEach((cb: lifeCycleRunnner<any>) => {
            cb(target);
        });
        _map(target.constructor.orchastratorSymbol.lifeCycleHooks, (lifeCycleHook: lifeCycleHook<T>, lifeCycleName: lifeCycleHookName) => {
            target['_original_' + lifeCycleName] = target[lifeCycleName];
            target[lifeCycleName] = (runLifeCycleHooks as any)[lifeCycleName];
        });
    }

}

export function orchastrated<C extends ReactConstructor<{}>>(cls: C): C {
    if (!(cls as any).isOrchastrated) {
        return class extends cls {
            static isOrchastrated: boolean = true;

            constructor(...args: any[]) {
                super(...args);
                activateMixins((this as any) as WithOrchestratorMeta<C>)
            }
        };
    }
    return cls;
}

export function registerForConstructor<T, TE extends WithOrchestratorMeta<T> & T>(target: T, cb: lifeCycleRunnner<TE>): TE {
    const targetE = (target as any) as TE;
    targetE.orchastratorSymbol = targetE.orchastratorSymbol || {
            constructorHooks: []
        };
    targetE.orchastratorSymbol.constructorHooks = targetE.orchastratorSymbol.constructorHooks || [];
    targetE.orchastratorSymbol.constructorHooks.push(cb);
    return targetE;
}

export function registerLifeCycle<T, TE extends WithOrchestratorMeta<T> & T>(target: T,
                                                                             lifeCycleHookModifier: lifeCycleHookModifier,
                                                                             lifeCycleHook: lifeCycleHookName,
                                                                             cb: lifeCycleRunnner<TE>) {
    const targetE = (target as any) as TE;
    targetE.orchastratorSymbol = targetE.orchastratorSymbol || {
            lifeCycleHooks: {}
        };
    targetE.orchastratorSymbol.lifeCycleHooks![lifeCycleHook] = targetE.orchastratorSymbol.lifeCycleHooks![lifeCycleHook] || {};
    targetE.orchastratorSymbol.lifeCycleHooks![lifeCycleHook]![lifeCycleHookModifier] = targetE.orchastratorSymbol.lifeCycleHooks![lifeCycleHook]![lifeCycleHookModifier] || [];
    targetE.orchastratorSymbol.lifeCycleHooks![lifeCycleHook]![lifeCycleHookModifier]!.push(cb);
    return targetE;
}
