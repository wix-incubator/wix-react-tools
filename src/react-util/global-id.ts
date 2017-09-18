import * as React from 'react';
import { isComponentInstance } from '../react-decor/common';
import { privateState, StateProvider } from '../core/private-state';

let counter: number = 0;
const provider: StateProvider<string> = privateState('globalId', () => `${counter++}`);
const separator = '\u2794';
const globalIdPropsError = 'tried to get root id for a props object but the key id was not found.';

export interface MandatoryProps {
    id: string;
}

export type Identifiable = React.Component | { id: string }

function isGlobalIDProps(obj: any): obj is MandatoryProps {
    return obj && obj.hasOwnProperty('id');
}

function getRootId(obj: Identifiable): string {
    if (isComponentInstance(obj)) {
        if (isGlobalIDProps(obj.props)) {
            return obj.props.id;
        }
        return provider(obj);
    } else {
        if (isGlobalIDProps(obj)) {
            return obj.id;
        }
        throw new Error(globalIdPropsError);
    }
}

function getLocalId(rootId: string, id: string): string {
    return `${rootId}${separator}${id}`;
}

export namespace globalId {
    export type Props = MandatoryProps;
}

export const globalId = {
    getRootId,
    getLocalId
};
