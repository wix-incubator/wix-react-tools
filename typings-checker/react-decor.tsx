import {decorReactFunc, FuncElementHook} from "../dist/src/index";


declare const Comp: React.SFC<PropsWithName>;
declare const Comp2: React.SFC<PropsWithName2>;
declare const hooks: FuncElementHook<PropsWithName>
type PropsWithName = { name: string };
type PropsWithName2 = { name: Function };

describe('react decor function', () => {
    // $ExpectType <T1 extends {}>(comp: StatelessComponent<T1>) => StatelessComponent<T1>
    decorReactFunc({});

    // $ExpectType <T1 extends PropsWithName>(comp: StatelessComponent<T1>) => StatelessComponent<T1>
    decorReactFunc<PropsWithName>(hooks);

    // $ExpectType StatelessComponent<PropsWithName2>
    decorReactFunc(hooks)(Comp2); // todo: This should fail, but doesn't. check again with TS 2.5
});
