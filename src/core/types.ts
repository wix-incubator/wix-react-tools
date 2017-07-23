export type Class<T extends object> = new(...args: any[]) => T;
export type GlobalConfig = {
    devMode?: boolean;
}
