import {before, middleware, after, decorFunction} from "../dist/src/index";

declare function original(text: string): string;

declare function subset(text: 'foo'): 'bar';

declare function incompatible(text: number): number;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]): string;

describe(`middleware`, () => {
    // $ExpectType (text: string) => string
    middleware(mwHook)(original);
    // $ExpectType (text: "foo") => "bar"
    middleware(mwHook)(subset);
})

declare function bHook(methodArguments: [string]): [string];

describe(`before`, () => {
    // $ExpectType (text: string) => string
    before(bHook)(original);
    // $ExpectType (text: "foo") => "bar"
    before(bHook)(subset);
})

declare function aHook(methodResult: string): string;

describe(`after`, () => {
    // $ExpectType (text: string) => string
    after(aHook)(original);
    // $ExpectType (text: "foo") => "bar"
    after(aHook)(subset);
})

describe(`decorFunction`, () => {
    // $ExpectType (text: string) => string
    decorFunction({
        middleware: [mwHook],
        before: [bHook],
        after: [aHook]
    })(original);

    // $ExpectType (text: "foo") => "bar"
    decorFunction({
        middleware: [mwHook],
        before: [bHook],
        after: [aHook]
    })(subset);
});


