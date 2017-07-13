export type FlagsContext = {
    devMode?: boolean;
    privateContextEnumerable?: boolean;         // This flag is used to expose private context as a field in the given instance in tests. Modify via config.
    middlewareWarnWhenChainBreaking?: boolean;    // When turned on, a middleware which doesn't call next - outputs a warning.
}

//TODO add default values here
