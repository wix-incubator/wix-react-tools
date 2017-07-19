interface Props {
    className: string;
    style?: {[k:string]:string};
    [k:string]: any;
}

export function root<T extends Partial<Props>, S extends Props>(componentProps: T, rootProps: S): T & S {
    if (typeof rootProps.className !== "string") {
        throw new Error(`root properties does not contain valid className defintion: ${rootProps.className}`);
    }

    const result = Object.assign({}, rootProps);

    for (let key in componentProps) {
        if (!key.indexOf('data-')) { // perf could be improved
            result[key] = componentProps[key];
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
