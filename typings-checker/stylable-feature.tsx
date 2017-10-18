import * as React from "react";
import {stylable} from "../dist/src/index";
import {RuntimeStylesheet, Stylesheet} from "stylable";


interface CompProps {
 //   foo: "bar";
}

declare const style : RuntimeStylesheet;

//
// const Comp: React.SFC<CompProps> = stylable(style)(props => {
//     return <div />;
// });


// $ExpectType React.SFC<CompProps>
stylable(style)((props: CompProps) => {
    return <div />;
});
