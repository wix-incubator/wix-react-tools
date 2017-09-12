import * as React from 'react';
import { privateState, StateProvider } from '../core/private-state';

let counter: number = 0;
const provider: StateProvider<{id: number}, object> = privateState('globalId', () => ({ id: counter++ }));
const separator = '\u2794';

export function isComponentInstance(value: any): value is React.Component {
    return value && value instanceof React.Component;
}

export interface GlobalIDProps {
    id?: string;
}

export interface GlobalID {
    getRootId: (obj: object) => string,
    getLocalId: (rootId: string, id: string) => string
}

function getRootId(obj: object): string {
    if (isComponentInstance(obj)) {
        if (obj.props && obj.props.hasOwnProperty('id')) {
            return (obj.props as {id: string}).id;
        }
    } else {
        if (obj.hasOwnProperty('id')) {
            return (obj as {id: string}).id;
        }
    }

    return `${provider(obj).id}`;
}

function getLocalId(rootId: string, id: string): string {
    return `${rootId}${separator}${id}a`;
}

export namespace globalId {
    export type Props = GlobalIDProps;
}

export const globalId: GlobalID = {
    getRootId,
    getLocalId
};

