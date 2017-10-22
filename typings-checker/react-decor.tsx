import {reactDecor, StatelessElementHook} from "../dist/src/index";

declare const SFComp: React.SFC<PropsWithName>;
declare const SFComp2: React.SFC<PropsWithName2>;
declare const ClassComp: React.ComponentClass<PropsWithName>;
declare const hook: StatelessElementHook<PropsWithName>;
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('React Decorator', () => {
    // $ExpectType Wrapper<{}>
    reactDecor.makeWrapper([]);

    // $ExpectType Wrapper<{}>
    reactDecor.makeWrapper([], []);

    // $ExpectType Wrapper<PropsWithName>
    reactDecor.makeWrapper([hook]);

    // $ExpectType Wrapper<PropsWithName>
    reactDecor.makeWrapper([hook], [hook]);

    // $ExpectType StatelessComponent<PropsWithName>
    reactDecor.makeWrapper([], [])(SFComp);

    // $ExpectType ComponentClass<PropsWithName>
    reactDecor.makeWrapper([], [])(ClassComp);
});
