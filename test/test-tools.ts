import {Class} from "../src/utils/class-decor";
import {sinon} from 'test-drive-react';

// a type that adds spy type to each field
export type Spied<T extends { [k: string]: Function }> = {
    [P in keyof T]: T[P] & sinon.SinonSpy;
    };

// helper to spy all methods with good typings
export function spyAll<T extends { [k: string]: Function }>(obj: T): Spied<T> {
    Object.keys(obj).forEach(k => sinon.spy(obj, k));
    return obj as any;
}

export function resetAll<T extends { [k: string]: Function }>(obj: Spied<T>): void {
    Object.keys(obj).forEach((k: keyof T) => obj[k].reset());
}

export function getHeritage(clazz: Class<any>): Array<Class<any>> {
    const res = [];
    while (clazz !== Object) {
        res.unshift(clazz);
        clazz = Object.getPrototypeOf(clazz.prototype).constructor;
    }
    return res;
}
