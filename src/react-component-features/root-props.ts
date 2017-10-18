// import {If, ObjectOmit, StringContains} from "typelevel-ts";
export interface ComponentProps {
    className?: string;
    style?: { [k: string]: string };
    'style-state'?: { [k: string]: boolean };
    'data-automation-id'?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
}

export interface JSComponentProps extends ComponentProps {
    [k: string]: any;
}

const copyAttributes: { [k: string]: any } = {
    'aria-label': true,
    'aria-labelledby': true,
    'aria-describedby': true
};

// Partial because there is no way more precise to express data-* and on* filtering
// pending https://github.com/Microsoft/TypeScript/issues/6579
export type PartialProps<T, B extends keyof T> = any

export function rootProps<T extends JSComponentProps, S extends JSComponentProps, B extends keyof T = never>(componentProps: T, rootProps: S, blacklist?: B[]): PartialProps<T, B> & S {
    const result = Object.assign({}, rootProps);

    for (let key in componentProps) {
        if (!blacklist || !~blacklist.indexOf(key as B)) {
            if (key.startsWith('data-')) {
                if (key === 'data-automation-id') {
                    const resultDaid = result[key];
                    const propsDaid = componentProps[key];
                    if (typeof resultDaid === "string" && typeof propsDaid === 'string') {
                        result[key] = resultDaid.trim() + ' ' + propsDaid.trim();
                    } else {
                        result[key] = componentProps[key];
                    }
                } else {
                    result[key] = componentProps[key];
                }
            } else if (copyAttributes[key]) {
                result[key] = componentProps[key];
            }
        }
    }

    if (typeof componentProps.style === "object") {
        if (typeof result.style === "object") {
            for (const key in componentProps.style) {
                result.style[key] = componentProps.style[key];
            }
        } else {
            result.style = componentProps.style;
        }
    }

    if (typeof componentProps.className === "string") {
        if (typeof rootProps.className === "string") {
            result.className = rootProps.className.trim() + ' ' + componentProps.className.trim();
        } else {
            result.className = componentProps.className;
        }
    }

    return result as any;
}
