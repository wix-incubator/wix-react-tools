import * as React from 'react';
import { isComponentInstance } from '../react-decor/common';
import { privateState, StateProvider } from '../core/private-state';

let counter: number = 0;
const provider: StateProvider<{id: string}> = privateState('globalId', () => ({ id: `${counter++}` }));
const separator = '\u2794';
const globalIdPropsError = 'tried to get root id for a props object but the key id was not found.';

export interface GlobalIDProps {
    id: string;
}

export interface GlobalID {
    getRootId: (obj: object) => string,
    getLocalId: (rootId: string, id: string) => string
}

function conformsToGlobalIDProps(obj: React.Component): obj is React.Component<GlobalIDProps> {
    return obj.props && obj.props.hasOwnProperty('id');
}

function getRootId(obj: object): string {
    if (isComponentInstance(obj)) {
        if (conformsToGlobalIDProps(obj)) {
            return obj.props.id;
        }
        return provider(obj).id;
    } else {
        if (obj.hasOwnProperty('id')) {
            return (obj as {id: string}).id;
        }
        throw new Error(globalIdPropsError);
    }
}

function getLocalId(rootId: string, id: string): string {
    return `${rootId}${separator}${id}`;
}

export namespace globalId {
    export type Props = GlobalIDProps;
}

export const globalId: GlobalID = {
    getRootId,
    getLocalId
};

