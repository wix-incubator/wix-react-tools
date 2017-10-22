import {InheritedWrapApi, Wrapper} from "../wrappers/index";
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

export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;

export class ClassDecor extends InheritedWrapApi<Partial<ClassMetaData>, Class<object>> {

    static readonly instance = new ClassDecor();

    // singleton
    private constructor() {
        if (ClassDecor.instance) {
            return ClassDecor.instance;
        }
        super('class-decor');
    }

    onInstance<T extends object>(hook: ConstructorHook<T>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata([hook], null, null));
    }

    method<T extends object, N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Wrapper<T[N]>>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, {[methodName]: functionDecorators}, null));
    }

    forceMethod<T extends object, N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Wrapper<T[N]>>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, {[methodName]: forceMethod(...functionDecorators)}, null));
    }

    defineProperty<T extends object, N extends keyof T = any>(propName: N, property: TypedPropertyDescriptor<T[N]>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, null, {[propName]: property}));
    }

    defineProperties<T extends object>(properties: TypedPropertyDescriptorMap<T>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, null, properties));
    }

    protected mergeArgs(base: ClassMetaData, addition: ClassMetaData): ClassMetaData {
        return {
            constructorHooks: mergeOptionalArrays(base.constructorHooks, addition.constructorHooks), //old be
            methodsMetadata: mergeMethodsMetadata(base.methodsMetadata, addition.methodsMetadata),
            properties: Object.assign({}, addition.properties, base.properties),
        };
    }

    protected wrappingLogic<T extends Class<object>>(this: ClassDecor, target: T): T {
        if (this.isThisWrapped(target)) {
            return target;
        } else {
            return extendClass(this, target);
        }
    }

}

export const classDecor = ClassDecor.instance;
