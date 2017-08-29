import { decorReact as decorReactFunc } from "../dist/src/react/react-decor-function";
import { decorateReactComponent, ElementHook } from "../dist/src/index";


declare const Comp: React.SFC<PropsWithName>;
declare const Comp2: React.SFC<PropsWithName2>;
declare const hooks: ElementHook<PropsWithName>
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('react decor function', () => {
    // $ExpectType SFCDecorator<{}>
    decorReactFunc({});

    // $ExpectType SFCDecorator<PropsWithName>
    decorReactFunc<PropsWithName>(hooks);

    // $ExpectType StatelessComponent<PropsWithName2>
    decorReactFunc(hooks)(Comp2); // todo: This should fail, but doesn't. check again with TS 2.5
});
