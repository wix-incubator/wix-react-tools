import * as React from "react";
import { expect, ClientRenderer } from "test-drive-react";
import { after } from "../../../../src/utils/class-decor";

describe("after mixin", () => {
    let clientRenderer: ClientRenderer;
    beforeEach(() => (clientRenderer = new ClientRenderer()));
    afterEach(() => clientRenderer.cleanup());

    //TODO get rid of dis?
    it("lets you add hooks for non-existent functions", () => {
        @after<any>((instance, methodReturn) => {
            return methodReturn;
        }, "duckWillQuack")
        class Duck {}
        expect(() => {
            let duck = new Duck();
            (duck as any).duckWillQuack();
        }).not.to.throw();
    });

    it("lets you add hooks for non-existent functions for a react component", () => {
        @after<any>((instance, methodReturn) => {
            return methodReturn;
        }, "componentWillMount")
        class Duck extends React.Component {
            render() {
                return null; //dummy
            }
        }

        expect(() => {
            const { container } = clientRenderer.render(<div />);
            clientRenderer.render(<Duck />, container);
        }).not.to.throw();
    });
});
