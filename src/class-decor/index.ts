import {Class, TypedPropertyDescriptorMap} from "../core/types";
import {InheritedWrapApi, Wrapper} from "../wrappers/index";
import {
    classDecorWrapper, ClassMetaData, ConstructorHook, forceMethod, makeClassDecorMetadata,
    mergeClassDecorMetadata
} from "./logic";

export type ClassDecorator<T extends object> = <T1 extends T>(clazz: Class<T1>) => Class<T1>;

export class ClassDecor extends InheritedWrapApi<Partial<ClassMetaData>, Class<object>> {

    static readonly instance = new ClassDecor();

    // singleton
    private constructor(){
        if (ClassDecor.instance){
            return ClassDecor.instance;
        }
        super('class-decor', classDecorWrapper, mergeClassDecorMetadata);
    }

    onInstance<T extends object>(hook: ConstructorHook<T>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata([hook], null, null));
    }

    method<T extends object , N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Wrapper<T[N]>>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, {[methodName] : functionDecorators}, null));
    }

    forceMethod<T extends object, N extends keyof T = any>(methodName: N, ...functionDecorators: Array<Wrapper<T[N]>>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, {[methodName] : forceMethod(...functionDecorators)}, null));
    }

    defineProperty<T extends object, N extends keyof T = any>(propName: N, property: TypedPropertyDescriptor<T[N]>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, null, {[propName] : property}));
    }

    defineProperties<T extends object>(properties: TypedPropertyDescriptorMap<T>): ClassDecorator<T> {
        return this.makeWrapper(makeClassDecorMetadata(null, null, properties));
    }
}

export const classDecor = ClassDecor.instance;

