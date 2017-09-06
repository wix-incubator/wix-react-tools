import { decorReact as decorReactFunc } from "../dist/src/react-decor/react-decor-function";
import { ElementHook } from "../dist/src/react-decor/common";
import { decorateReactComponent } from "../dist/src/index";


declare const SFComp: React.SFC<PropsWithName>;
declare const SFComp2: React.SFC<PropsWithName2>;
declare const ClassComp: React.ComponentClass<PropsWithName>;
declare const hook: ElementHook<PropsWithName>
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('react decor function', () => {
    describe('Stateless Functional Component Decorator', () => {
        // $ExpectType SFCDecorator<{}>
        decorReactFunc({});

        // $ExpectType SFCDecorator<PropsWithName>
        decorReactFunc<PropsWithName>(hook);

        // $ExpectType StatelessComponent<PropsWithName2>
        decorReactFunc(hook)(SFComp2); // todo: This should fail, but doesn't. check again with TS 2.5
    });

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
});
