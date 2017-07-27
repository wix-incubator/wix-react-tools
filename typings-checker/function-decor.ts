import {Args, before, middleware, after} from "../dist/src/index";

declare function original(text: string): string;
declare function subset(text: 'foo'): 'bar';
declare function incompatible(text: number): number;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]): string;
declare function subsetMwHook(next: (methodArguments: ['foo']) => 'bar', methodArguments: ['foo']): 'bar';
declare function incompatibleMwHook(next: (methodArguments: [number]) => string, methodArguments: [number]): string;
describe(`middleware`, () => {

    describe(`Test original type`, () => {

        // $ExpectType (text: string) => string
        middleware<Args<[string]>, string>(mwHook)(original);

        // $ExpectType (text: string) => string
        middleware(mwHook)(original);
    })
    describe(`Test with an incompatible type`, () => {
        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: string) => string
            middleware(incompatibleMwHook)(original);
        })

        // $ExpectError Type 'number' is not assignable to type 'string'
        middleware(mwHook)(incompatible);

        // $ExpectError Type 'string' is not assignable to type 'number'
        middleware<Args<[string]>, string>(mwHook)(incompatible);

        // $ExpectError Type 'number' is not assignable to type 'string'
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

declare function bHook(methodArguments: [string]): [string];
declare function subsetBHook(methodArguments: ['foo']): ['foo'];
declare function incompatibleBHook(methodArguments: [number]): [number];
describe(`before`, () => {

    describe(`Test original type`, () => {

        // $ExpectType (text: string) => string
        before<Args<[string]>>(bHook)(original);

        // $ExpectType (text: string) => string
        before(bHook)(original);
    })
    describe(`Test with an incompatible type`, () => {
        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: number) => number
            before(bHook)(incompatible);

            // $ExpectType (text: string) => string
            before(incompatibleBHook)(original);
        })

        // $ExpectError Type 'string' is not assignable to type 'number'
        before<Args<[string]>>(bHook)(incompatible);

        // $ExpectError Type 'string' is not assignable to type 'number'
        before<Args<[string]>>(incompatibleBHook);
    })
    describe(`Test with a subset`, () => {

        // $ExpectType (text: "foo") => "bar"
        before(bHook)(subset);

        // $ExpectType (text: "foo") => "bar"
        before<Args<[string]>>(bHook)(subset);

        // $ExpectError Type '[string]' is not assignable
        before<Args<['foo']>>(bHook);

        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: string) => string
            before<Args<[string]>>(subsetBHook)(original)
        })
    })
})

declare function aHook(methodResult: string): string;
declare function subsetAHook(methodResult: 'bar'): 'bar';
declare function incompatibleAHook(methodResult: number): number;
describe(`after`, () => {

    describe(`Test original type`, () => {

        // $ExpectType (text: string) => string
        after<string>(aHook)(original);

        // $ExpectType (text: string) => string
        after(aHook)(original);
    })
    describe(`Test with an incompatible type`, () => {

        // $ExpectError Type 'number' is not assignable to type 'string'
        after(aHook)(incompatible);

        // $ExpectError Type 'number' is not assignable to type 'string'
        after<string>(aHook)(incompatible);

        // $ExpectError Type 'string' is not assignable to type 'number'
        after(incompatibleAHook)(original);

        // $ExpectError Type 'string' is not assignable to type 'number'
        after<string>(incompatibleAHook);
    })
    describe(`Test with a subset`, () => {

        // $ExpectType (text: "foo") => "bar"
        after(aHook)(subset);

        // $ExpectType (text: "foo") => "bar"
        after<string>(aHook)(subset);

        // $ExpectError is not assignable to type 'string'
        after<Args<['foo']>, 'bar'>(aHook);

        describe(`documentation only (TODO: make it break)`, () => {

            // $ExpectType (text: string) => string
            after<string>(subsetAHook)(original)
        })
    })
})




