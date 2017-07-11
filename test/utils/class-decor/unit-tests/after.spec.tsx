import * as React from "react";
import { expect } from "test-drive-react";
import { after } from "../../../../src/utils/class-decor";

describe("after mixin", () => {
    it("lets you add hooks for non-existent functions",()=>{
        expect(()=>{
            @after<any>((instance,methodReturn)=>{
                return methodReturn;
            },"SomeFunction")
            class Duck {}
        }).not.to.throw();
    });

    it("lets you add hooks for non-existent functions for a react component",()=>{
        expect(()=>{
            @after<any>((instance,methodReturn)=>{
                return methodReturn;
            },"componentWillUnmount")
            class Duck extends React.Component{}
        }).not.to.throw();
    });
});
