import {properties} from "../dist/src/index";
import * as React from "react";

interface Props {
    name: string;
}

type VerboseProps = properties.Props & Props;

describe(`with porperties type that includes properties.Props`, () => {
    it(`can decorate class components`, () => {
        @properties
        class Comp extends React.Component<VerboseProps> {
            render() {
                return <div data-automation-id="Root"/>;
            }
        }
    });

    it(`can decorate functional components`, () => {
        properties((p: VerboseProps) => <div data-automation-id="Root"/>)
    });
});

describe(`with porperties type that does not include properties.Props`, () => {
    it(`error decorating class components`, () => {
// $ExpectError 'typeof Comp' is not assignable to
        @properties
        class Comp2 extends React.Component<Props> {
            render() {
                return <div data-automation-id="Root"/>;
            }
        }

    });

    it(`error wrapping SFC functional components`, () => {
// $ExpectError '(p: Props) => Element' is not assignable to
        properties((p: Props) => <div data-automation-id="Root"/>)
    });
});
