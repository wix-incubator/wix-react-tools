import {reactDecor, StatelessElementHook} from "../dist/src/index";

declare const SFComp: React.SFC<PropsWithName>;
declare const SFComp2: React.SFC<PropsWithName2>;
declare const ClassComp: React.ComponentClass<PropsWithName>;
declare const hook: StatelessElementHook<PropsWithName>;
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };


describe('React Decorator', () => {
    // $ExpectType Feature<ComponentType<any>>
    reactDecor.makeFeature([]);

    // $ExpectType Feature<ComponentType<any>>
    reactDecor.makeFeature([], []);

    // $ExpectType Feature<ComponentType<PropsWithName>>
    reactDecor.makeFeature([hook]);

    // $ExpectType Feature<ComponentType<PropsWithName>>
    reactDecor.makeFeature([hook], [hook]);

    // $ExpectType StatelessComponent<PropsWithName>
    reactDecor.makeFeature([], [])(SFComp);

    // $ExpectType ComponentClass<PropsWithName>
    reactDecor.makeFeature([], [])(ClassComp);
});

