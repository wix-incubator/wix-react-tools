import {functionDecor} from "../dist/src/index";

declare function original(text: string): string;

declare function subset(text: 'foo'): 'bar';

declare function incompatible(text: number): number;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]): string;

describe(`middleware`, () => {
    // $ExpectType (text: string) => string
    functionDecor.middleware(mwHook)(original);
    // $ExpectType (text: "foo") => "bar"
    functionDecor.middleware(mwHook)(subset);
})

declare function bHook(methodArguments: [string]): [string];

describe(`before`, () => {
    // $ExpectType (text: string) => string
    functionDecor.before(bHook)(original);
    // $ExpectType (text: "foo") => "bar"
    functionDecor.before(bHook)(subset);
})

declare function aHook(methodResult: string): string;

describe(`after`, () => {
    // $ExpectType (text: string) => string
    functionDecor.after(aHook)(original);
    // $ExpectType (text: "foo") => "bar"
    functionDecor.after(aHook)(subset);
})

describe(`decorFunction`, () => {
    // $ExpectType (text: string) => string
    functionDecor.makeFeature({
        middleware: [mwHook],
        before: [bHook],
        after: [aHook]
    })(original);

    // $ExpectType (text: "foo") => "bar"
    functionDecor.makeFeature({
        middleware: [mwHook],
        before: [bHook],
        after: [aHook]
    })(subset);
});


