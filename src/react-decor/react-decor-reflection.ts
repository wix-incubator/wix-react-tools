import { privateState } from "../core/private-state";

declare const process: {env : {[k:string]: any}};

export function reflection<T extends object = any>(id: string) {
    const decorationReflection = privateState<Array<any>, T>(id, (targetObj: T) => []);

    return {
        registerDecorator(source: T, target: T, decoratorId: any): void {
            const isTargetDecorated = decorationReflection.hasState(target);
            const newDecorators = decorationReflection(target); // new private state will be created if missing

            // check if target is not yet decorated, and copies all decorators from the source to the new target
            if (!isTargetDecorated && source !== target && decorationReflection.hasState(source)) {
                const prevDecorators = decorationReflection(source);
                newDecorators.push(...prevDecorators);
            }

            if (newDecorators.indexOf(decoratorId) !== -1) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(target, ' is already decorated with ', decoratorId);
                }
                return undefined;
            }
            newDecorators.push(decoratorId);
        },
        isDecorated(Comp: T, decoratorId?: any): boolean {
            const decorators = decorationReflection(Comp);
            if (!decoratorId) {
                return decorationReflection(Comp).length > 0;
            } else {
                return decorators.some(decorator => decorator === decoratorId);
            }
        }
    }
}
