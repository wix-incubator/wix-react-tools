import {mergeEventHandlers} from "./merge-events";
export interface Props {
    className: string;
    style?: {[k:string]:string};
    'data-automation-id'?:string;
    [k:string]: any;
}

// TODO use curated list?
function isEventHandlerName(key:string){
    if (key.startsWith('on')){
        const handlerFirstLetter = key['on'.length];
        return (handlerFirstLetter === handlerFirstLetter.toUpperCase());
    }
    return false;
}

export function root<T extends Partial<Props>, S extends Props>(componentProps: T, rootProps: S, blacklist:string[] = []): T & S {
    if (typeof rootProps.className !== "string") {
        throw new Error(`root properties does not contain valid className defintion: ${rootProps.className}`);
    }

    const result = Object.assign({}, rootProps);

    for (let key in componentProps) {
        if (!~blacklist.indexOf(key)) {
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
            } else if (isEventHandlerName(key)) {
                if (typeof result[key] === "function") {
                    result[key] = mergeEventHandlers(componentProps[key], result[key]);
                } else {
                    result[key] = componentProps[key];
                }
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
