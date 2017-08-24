import * as React from 'react';

export function isReactClassComponent(value: any): value is React.ComponentClass<any> {
    return value && value.prototype && value.prototype instanceof React.Component;
}

export function isNotEmptyArray(arr: Array<any> | undefined): arr is Array<any> {
    return !!(arr && (arr.length > 0));
}
