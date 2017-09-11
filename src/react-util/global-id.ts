import * as React from 'react';
import { privateState, StateProvider } from '../core/private-state';

export const separator = '##';

export function isComponentInstance(value: any): value is React.Component {
    return value && value instanceof React.Component;
}

export class GlobalID {
    private counter: number = 0;
    private provider: StateProvider<object, number>;
    constructor(key: string) {
        super(key);

        this.provider = privateState(key, () => this.counter++);
    }

    getRootId(obj: object): string {
        if (isComponentInstance(obj)) {
            if (obj.props.hasOwnProperty('id')) return (obj.props as {id: string}).id;
        } else {
            if (obj.hasOwnProperty('id')) return (obj as {id: string}).id;
        }

        return this.provider(obj);
    }

    getLocalId(rootId: string, id: string) {
        return `${rootId}${separator}${id}`;
    }
}


