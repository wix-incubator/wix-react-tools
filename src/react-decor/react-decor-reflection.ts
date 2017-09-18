import { Wrapper } from './index';
import { privateState } from "../core/private-state";
import { getGlobalConfig } from "../core/config";
import { GlobalConfig } from "../core/types";

export function reflection<T extends object = any>(id: string) {
    const decorationReflection = privateState<Array<any>, T>(id, (targetObj: T) => []);

    return {
        registerDecorator(CompBeforeDecoration: T, CompAfterDecoration: T, decoratorIdentifier: any): void {
            const isWrapped = decorationReflection.hasState(CompAfterDecoration);
            const newDecorators = decorationReflection(CompAfterDecoration); // new private state will be created if missing

            if (!isWrapped && CompBeforeDecoration !== CompAfterDecoration && decorationReflection.hasState(CompBeforeDecoration)) {
                const prevDecorators = decorationReflection(CompBeforeDecoration);
                newDecorators.push(...prevDecorators);
            }

            if (newDecorators.indexOf(decoratorIdentifier) !== -1) {
                if (getGlobalConfig<GlobalConfig>().devMode) {
                    console.warn(CompAfterDecoration, ' is already decorated with ', decoratorIdentifier); 
                }
                return undefined;
            }
            newDecorators.push(decoratorIdentifier);
        },
        isDecorated(Comp: T, wrapper?: any): boolean {
            const decorators = decorationReflection(Comp);
            if (!wrapper) {
                return decorationReflection(Comp).length > 0;
            } else {
                return decorators.some(decorator => decorator === wrapper);
            }
        }
    }
}