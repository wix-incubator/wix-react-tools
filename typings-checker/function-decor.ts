import {Args, middleware} from "../dist/src/index";

declare function original(text: string): string;
declare function subset(text: 'foo'): 'bar';
declare function incompatible(text: number): string;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]): string;
declare function subsetMwHook(next: (methodArguments: ['foo']) => 'bar', methodArguments: ['foo']): 'bar';
declare function incompatibleMwHook(next: (methodArguments: [number]) => string, methodArguments: [number]): string;

describe(`Middlewares`, () => {
    describe(`Test original type`, () => {

        // $ExpectType (text: string) => string
        middleware<Args<[string]>, string>(mwHook)(original);

        // $ExpectType (text: string) => string
        middleware(mwHook)(original);
    })
    describe(`Test with an incompatible type`, () => {
        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: number) => string
            middleware(mwHook)(incompatible);

            // $ExpectType (text: string) => string
            middleware(incompatibleMwHook)(original);
        })

        // $ExpectError Type 'string' is not assignable to type 'number'
        middleware<Args<[string]>, string>(mwHook)(incompatible);

        // $ExpectError Type 'number' is not assignable to type 'string'.
        middleware<Args<[string]>, string>(incompatibleMwHook);
    })
    describe(`Test with a subset`, () => {

        // $ExpectType (text: "foo") => "bar"
        middleware(mwHook)(subset);

        // $ExpectType (text: "foo") => "bar"
        middleware<Args<[string]>, string>(mwHook)(subset);

        // $ExpectError Type 'string' is not assignable
        middleware<Args<['foo']>, 'bar'>(mwHook);

        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: string) => string
            middleware<Args<[string]>, string>(subsetMwHook)(original)
        })
    })
})
