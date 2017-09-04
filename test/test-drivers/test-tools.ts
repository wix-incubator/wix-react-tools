import {sinon} from "test-drive-react";
import * as React from "react";
import {Class} from "../../src/";
import {flatten, isArray, map} from "lodash";

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

export function restoreAll<T extends { [k: string]: Function }>(obj: Spied<T>): void {
    Object.keys(obj).forEach((k: keyof T) => obj[k].restore());
}

export function getHeritage(clazz: Class<any>): Array<Class<any>> {
    const res = [];
    while (clazz !== Object) {
        res.unshift(clazz);
        clazz = Object.getPrototypeOf(clazz.prototype).constructor;
    }
    return res;
}

export function asSet<T>(arg: T | T[]): T[] {
    return isArray(arg) ? arg : [arg];
}

export interface SpyCallNode {
    c: sinon.SinonSpyCall,
    n: string
}

function makeError(prevName: string, nextName: string, spycallSets: Array<SpyCallNode | Array<SpyCallNode>>) {
    const flatNodes = flatten(spycallSets);
    return new Error(`${prevName} was called after ${nextName}.
expected : ${map(flatNodes, 'n').join(', ')}
actual   : ${map(flatNodes.sort((a, b) => a.c.calledAfter(b.c) ? 1 : -1), 'n').join(', ')}`);
}

export function expectSpyChain(...spycallSets: Array<SpyCallNode | Array<SpyCallNode>>) {
    spycallSets.reduce((prevSet, nextSet) => {
        asSet(prevSet).forEach(prev => asSet(nextSet).forEach(next => {
                if (prev.c.calledAfter(next.c)) {
                    throw makeError(prev.n, next.n, spycallSets);
                }
            }
        ));
        return nextSet;
    });
}

export function makeClassComponent<P>(sfc: React.SFC<P>) {
    return class Component extends React.Component<P> {
        render() {
            return sfc(this.props);
        }
    }
}

export type StateAgnosticTestSuite = (Comp: React.ComponentType) => void;
export function testWithBothComponentTypes(sfc: React.SFC, suite: StateAgnosticTestSuite) {
    describe('SFC', () => {
        suite(sfc);
    });
    describe('Class Component', () => {
        suite(makeClassComponent(sfc));
    });
}
