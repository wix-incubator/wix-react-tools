import {middleware, _FunctionWrapper, Args} from "../dist/src/index";

declare function original(text: string): string;
declare function fake(text: number): string;

declare function mwHook(next: (methodArguments: [string]) => string, methodArguments: [string]):string;
declare function fakeMwHook(next: (methodArguments: [number]) => string, methodArguments: [number]):string;

const e1: typeof original = middleware(mwHook)(original);
// $ExpectError Type 'string' is not assignable to type 'number'
const e2: typeof original  = middleware(mwHook)(fake);
const e3: typeof original  = middleware<Args<[string]>, string>(mwHook)(original);
// $ExpectError Type 'string' is not assignable to type 'number'
middleware<Args<[string]>, string>(mwHook)(fake);

const e5: typeof original  = middleware(fakeMwHook)(original);
// $ExpectError Type '(text: number) => string' is not assignable to type '(text: string) => string'.
const e6: typeof original  = middleware(fakeMwHook)(fake);
// $ExpectError Type 'number' is not assignable to type 'string'.
middleware<Args<[string]>, string>(fakeMwHook);

