import { ComponentType, Component } from 'react';
import { Wrapper, DecorReactHooks, StatelessElementHook, StatefulElementHook, StatelessDecorReactHooks } from './index';
import { StateProvider, privateState } from "../core/private-state";
import { getGlobalConfig } from "../core/config";
import { GlobalConfig } from "../core/types";

export function createDecorationReflection<T extends object = any>(id: string) {
    const decorationReflection = privateState<Array<any>, T>(id, (targetObj: T) => []);

    return {
        addHooksToDecorReflection(Comp: T, Wrapped: T, decoratorIdentifier: any): void {
            const isWrapped = decorationReflection.hasState(Wrapped);
            const newDecorators = decorationReflection(Wrapped); // new private state will be created if missing

            if (!isWrapped && Comp !== Wrapped && decorationReflection.hasState(Comp)) {
                const prevDecorators = decorationReflection(Comp);
                newDecorators.push(...prevDecorators);
            }

            if (newDecorators.indexOf(decoratorIdentifier) !== -1) {
                if (getGlobalConfig<GlobalConfig>().devMode) {
                    console.warn(Wrapped, ' is already wrapped with ', decoratorIdentifier); // TODO: real warning & dev mode
                }
                return undefined;
            }
            newDecorators.push(decoratorIdentifier);
        },
        isDecorated(Comp: T, wrapper?: Wrapper<any>): boolean {
            const decorators = decorationReflection(Comp);
            if (!wrapper) {
                return decorationReflection(Comp).length > 0;
            } else {
                return decorators.some(decorator => decorator === wrapper);
            }
        }
    }
}