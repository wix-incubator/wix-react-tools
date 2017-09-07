import {decorateReactComponent, StatelessElementHook} from "../dist/src/index";

declare const SFComp: React.SFC<PropsWithName>;
declare const SFComp2: React.SFC<PropsWithName2>;
declare const ClassComp: React.ComponentClass<PropsWithName>;
declare const hook: StatelessElementHook<PropsWithName>;
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('React Decorator', () => {
    // $ExpectType Wrapper<{}, Component<{}, {}>>
    decorateReactComponent({});

    // $ExpectType Wrapper<{}, Component<{}, {}>>
    decorateReactComponent({}, {});

    // $ExpectType Wrapper<PropsWithName, Component<PropsWithName, {}>>
    decorateReactComponent(
        {
            onEachElement: [hook],
            onRootElement: [hook]
        });

    // $ExpectType Wrapper<PropsWithName, Component<PropsWithName, {}>>
    decorateReactComponent(
        {
            onEachElement: [hook],
            onRootElement: [hook]
        },
        {
            onEachElement: [hook],
            onRootElement: [hook]
        });

    // $ExpectType StatelessComponent<PropsWithName>
    decorateReactComponent({}, {})(SFComp);

    // $ExpectType ComponentClass<PropsWithName>
    decorateReactComponent({}, {})(ClassComp);
});
