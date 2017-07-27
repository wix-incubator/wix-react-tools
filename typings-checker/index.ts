import {NumberToString, ApiFunc, Args} from "../dist/src/index";

type FIVE = NumberToString[5];
const n2s1: FIVE = '5';
// $ExpectError Type '"6"' is not assignable to type '"5"'
const n2s2: FIVE = '6';

declare function parseInt(string: string, radix?: number): number;

const stringToNumber: ApiFunc<Args<[string]>, number> = parseInt;
// $ExpectError Type 'number' is not assignable to type 'string'
const numberToNumber: ApiFunc<Args<[number]>, number> = parseInt;
