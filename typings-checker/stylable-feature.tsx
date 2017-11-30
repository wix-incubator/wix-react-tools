import * as React from "react";
import {stylable} from "../dist/src/index";
import {RuntimeStylesheet} from "stylable";

interface CompProps {
    message: string;
}

declare const style: RuntimeStylesheet;

// $ExpectType (props: any) => Element
stylable(style)(props => {
    return <div/>;
});

// $ExpectType StatelessComponent<CompProps>
stylable(style)<React.SFC<CompProps>>(props => {
    return <div/>;
});

// $ExpectType (props: CompProps) => Element
stylable(style)((props: CompProps) => {
    return <div/>;
});
