export enum Flags{
    ENUMERABLE_FLAG = 'privateContextEnumerable',  // This flag is used to expose private context as a field in the given instance in tests. Modify via config.
    ENABLE_CHAIN_BREAKING_FLAG = 'middlewareEnableChainBreaking'  // When turned off, a middleware which doesn't call next - outputs a warning.
}

//TODO add default values here
