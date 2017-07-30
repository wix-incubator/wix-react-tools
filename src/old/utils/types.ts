export type ReactConstructor<mixin> = { new(...args: any[]): React.Component<any, any> & mixin };
