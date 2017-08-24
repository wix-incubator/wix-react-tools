import * as React from "react";
import {root} from "../dist/src/index";

type Ctx = { foo: number }
type Result = { bar: number }

describe('root function API', () => {
    interface Props {
        p1: string;
        p2: string;
    }
    const p: Props = 0 as any;

    it('mandatory className', () => {
// $ExpectError Property 'className' is missing in type '{}'
        root(p, {});
    });

    it('regression 1', () => {
        interface CompProps {
            onChange(value: string): void;
        }
        const compProps: CompProps = 0 as any;

        const div = <div {...root(compProps, {className: 'test'}, ['onChange'])} />;
    });

});
