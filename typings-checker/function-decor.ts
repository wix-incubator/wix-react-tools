import {Args, middleware} from "../dist/src/index";

declare function original(text: string): string;
declare function specific(text: 'foo'): 'bar';
declare function moreSpecific(this:'fooBar', text: 'foo'): 'bar';
declare function fake(text: number): string;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]): string;
declare function specificMwHook(next: (methodArguments: ['foo']) => 'bar', methodArguments: ['foo']): 'bar';
declare function fakeMwHook(next: (methodArguments: [number]) => string, methodArguments: [number]): string;

describe(`Middlewares`, () => {
    describe(`Test original type`, () => {
        // $ExpectType (text: string) => string
        middleware<Args<[string]>, string>(mwHook)(original);

        // $ExpectType (text: string) => string
        middleware(mwHook)(original);
    })
    describe(`Test with an incompatible type ('fake')`, () => {
        // $ExpectType (text: number) => string
        middleware(mwHook)(fake);

        // $ExpectType (text: string) => string
        middleware(fakeMwHook)(original);

        // $ExpectError Type 'string' is not assignable to type 'number'
        middleware<Args<[string]>, string>(mwHook)(fake);

        // $ExpectError Type 'number' is not assignable to type 'string'.
        middleware<Args<[string]>, string>(fakeMwHook);
    })
    describe(`Test with a subset ('specific') `, () => {
        // $ExpectType (text: "foo") => "bar"
        middleware(mwHook)(specific);

        // $ExpectType (text: "foo") => "bar"
        middleware<Args<[string]>, string>(mwHook)(specific);

        // $ExpectError Type 'string' is not assignable
        middleware<Args<['foo']>, 'bar'>(mwHook);
    })
})
