import {DecorClassApi} from "../wrappers/index";
import {
    ClassMetaData,
    ConstructorHook,
    extendClass,
    forceMethod,
    makeClassDecorMetadata,
    mergeMethodsMetadata
} from "./logic";
import {Class, TypedPropertyDescriptorMap} from "../core/types";
import {mergeOptionalArrays} from "../functoin-decor/common";
import {Feature} from "../wrappers/feature-manager";

export type ClassFeature<T extends object> = Feature<Class<T>>;

export class ClassDecor extends DecorClassApi<Partial<ClassMetaData>, Class<object>> {

    static readonly instance = new ClassDecor();

    // singleton
    private constructor() {
        if (ClassDecor.instance) {
            return ClassDecor.instance;
        }
        super('class-decor');
    }

    onInstance<T extends object>(hook: ConstructorHook<T>): ClassFeature<T> {
        return this.makeFeature(makeClassDecorMetadata([hook], null, null));
    }

    method<T extends object, N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Feature<T[N]>>): ClassFeature<T> {
        return this.makeFeature(makeClassDecorMetadata(null, {[methodName]: functionDecorators}, null));
    }

    forceMethod<T extends object, N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Feature<T[N]>>): ClassFeature<T> {
        return this.makeFeature(makeClassDecorMetadata(null, {[methodName]: forceMethod(...functionDecorators)}, null));
    }

    defineProperty<T extends object, N extends keyof T = any>(propName: N, property: TypedPropertyDescriptor<T[N]>): ClassFeature<T> {
        return this.makeFeature(makeClassDecorMetadata(null, null, {[propName]: property}));
    }

    defineProperties<T extends object>(properties: TypedPropertyDescriptorMap<T>): ClassFeature<T> {
        return this.makeFeature(makeClassDecorMetadata(null, null, properties));
    }

    protected mergeDecorations(base: ClassMetaData, addition: ClassMetaData): ClassMetaData {
        return {
            constructorHooks: mergeOptionalArrays(base.constructorHooks, addition.constructorHooks), //old be
            methodsMetadata: mergeMethodsMetadata(base.methodsMetadata, addition.methodsMetadata),
            properties: Object.assign({}, addition.properties, base.properties),
        };
    }

    protected decorationLogic<T extends Class<object>>(this: ClassDecor, target: T): T {
        if (this.isThisDecorated(target)) {
            return target;
        } else {
            return extendClass(this, target);
        }
    }

}

export const classDecor = ClassDecor.instance;
