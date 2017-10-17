import {decorateReactComponent, StatelessElementHook, elementHooks} from "../dist/src/index";

declare const SFComp: React.SFC<PropsWithName>;
declare const SFComp2: React.SFC<PropsWithName2>;
declare const ClassComp: React.ComponentClass<PropsWithName>;
declare const hook: StatelessElementHook<PropsWithName>;
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('React Decorator', () => {
    // $ExpectType Wrapper<{}>
    decorateReactComponent(elementHooks(null, null));

    // $ExpectType Wrapper<{}>
    decorateReactComponent(elementHooks(null, null), elementHooks(null, null));

    // $ExpectType Wrapper<PropsWithName>
    decorateReactComponent([hook]);

    // $ExpectType Wrapper<PropsWithName>
    decorateReactComponent([hook],[hook]);

    // $ExpectType StatelessComponent<PropsWithName>
    decorateReactComponent(elementHooks(null, null), elementHooks(null, null))(SFComp);

    // $ExpectType ComponentClass<PropsWithName>
    decorateReactComponent(elementHooks(null, null), elementHooks(null, null))(ClassComp);
});
