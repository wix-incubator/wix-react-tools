// import {If, ObjectOmit, StringContains} from "typelevel-ts";
export interface ComponentProps {
    className?: string;
    style?: { [k: string]: string };
    'style-state'?: { [k: string]: boolean };
    'data-automation-id'?: string;
    'aria-label'?:string;
    'aria-labelledby'?:string;
    'aria-describedby'?:string;
    [k: string]: any;
}
export interface Props extends ComponentProps {
    className: string;
}

const copyAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby'];

// Partial because there is no way more precise to express data-* and on* filtering
// pending https://github.com/Microsoft/TypeScript/issues/6579
export type PartialProps<T, B extends keyof T> = any

export function rootProps<T extends ComponentProps, S extends Props, B extends keyof T = never>(componentProps: T, rootProps: S, blacklist?: B[]): PartialProps<T, B> & S {
    if (typeof rootProps.className !== "string") {
        throw new Error(`root properties does not contain valid className defintion: ${rootProps.className}`);
    }

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
            } else if (~copyAttributes.indexOf(key)){
                result[key] = componentProps[key];
            }
        }
    }

    if (typeof componentProps.style === "object") {
        if (typeof result.style === "object") {
            for (let key in componentProps.style) {
                result.style[key] = componentProps.style[key];
            }
        } else {
            result.style = componentProps.style;
        }
    }

    if (typeof componentProps.className === "string") {
        result.className = rootProps.className.trim() + ' ' + componentProps.className.trim();
    }

    return result as any;
}
