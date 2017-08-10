import {ApiFunc, Args, NumberToString, root} from "../dist/src/index";

type FIVE = NumberToString[5];
const n2s1: FIVE = '5';
// $ExpectError Type '"6"' is not assignable to type '"5"'
const n2s2: FIVE = '6';

type Ctx = { foo: number }
type Result = { bar: number }

// $ExpectType (this: never, a0: "0", a1: "1", a2: "2", a3: "3", a4: "4", a5: "5", a6: "6", a7: "7", a8: "8", a9...
0 as any as ApiFunc<Args<['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']>, Result>

// $ExpectType (this: Ctx, a0: "0", a1: "1", a2: "2") => Result
0 as any as ApiFunc<Args<['0', '1', '2']>, Result, Ctx>

interface Props {
    p1 : string;
}
declare const p : Props;

// $ExpectError Property 'className' is missing in type '{}'
root(p, {})

// $ExpectType Partial<Props> & { className: string; }
root(p, {className:'bar'})

