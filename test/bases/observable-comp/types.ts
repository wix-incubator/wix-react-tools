
export interface testHooks {
    onRender?: (comp: any) => void;
    onMount?: (comp: any) => void;
    onWhen?: (comp: any) => void;
}

export interface person {
    name?: string;
    age?: number;
    smell?: string;
}

export interface withPerson{
    man?: person;
}
