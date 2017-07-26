import {flatten, isArray, map} from "lodash";
import {sinon} from "test-drive-react";

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
