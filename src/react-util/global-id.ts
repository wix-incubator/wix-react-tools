import * as React from 'react';

export const separator = '##';

export function isComponentInstance(value: any): value is React.Component {
    return value && value instanceof React.Component;
}

export function getRootId(obj: object): string {
    if (isComponentInstance(obj)) {
        if (obj.props.hasOwnProperty('id')) return (obj.props as {id: string}).id;
    } else {

    }
    return 'abc';
}

export function getLocalId(rootId: string, id: string) {
    return `${rootId}${separator}${id}`;
}
