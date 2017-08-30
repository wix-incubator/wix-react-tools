import { properties } from "../dist/src/index";
import * as React from "react";
import {ComponentProps} from "../src/react-features/root-props";

interface Props {
    name:string;
}

type VerboseProps = properties.Props & Props;

@properties
class Comp2 extends React.Component<VerboseProps> {
    render() {
        return <div data-automation-id="Root"/>;
    }
}
properties((p:VerboseProps)=><div data-automation-id="Root"/>)

// $ExpectError 'typeof Comp' is not assignable to
@properties
class Comp extends React.Component<Props> {
    render() {
        return <div data-automation-id="Root"/>;
    }
}

// $ExpectError '(p: Props) => Element' is not assignable to
properties((p:Props)=><div data-automation-id="Root"/>)

