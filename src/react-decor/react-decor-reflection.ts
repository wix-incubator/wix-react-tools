import { privateState } from "../core/private-state";

declare const process: {env : {[k:string]: any}};

export const decorationReflection = reflection('react-decor-reflection');

interface Metadata {
    decorators : any[];
    original : object;
}
export function reflection<T extends object = any>(id: string) {
    const decorationReflection = privateState<Metadata, T>(id, (targetObj: T) => ({
        original : null as any,
        decorators : []
    }));

    return {
        registerDecorator(source: T, target: T, decoratorId: any): void {
            const isTargetDecorated = decorationReflection.hasState(target);
            const metadata = decorationReflection(target); // new private state will be created if missing

            if (decorationReflection.hasState(source)){
                console.error('TODO: no double wrappings!');
            }
            if (!isTargetDecorated) {
                metadata.original = source;
                // check if target is not yet decorated, and copies all decorators from the source to the new target
                if (source !== target && decorationReflection.hasState(source)) {
                    const prevMetadata = decorationReflection(source);
                    metadata.decorators.push(...prevMetadata.decorators);
                }
            }
            if (metadata.decorators.indexOf(decoratorId) !== -1) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(target, ' is already decorated with ', decoratorId);
                }
                return undefined;
            }
            metadata.decorators.push(decoratorId);
        },
        isDecorated(Comp: T, decoratorId?: any): boolean {
            const decorators = decorationReflection(Comp);
            if (!decoratorId) {
                return decorationReflection(Comp).decorators.length > 0;
            } else {
                return decorators.decorators.some(decorator => decorator === decoratorId);
            }
        },
        getDecorated(Comp: T): T | null {
            if (decorationReflection.hasState(Comp)){
                return decorationReflection(Comp).original as T;
            }
            return null;
        }

    }
}
