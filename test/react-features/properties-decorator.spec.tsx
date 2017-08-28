import {inBrowser} from "mocha-plugin-env";
import {ClientRenderer, expect} from "test-drive-react";
import {properties} from "../../src";
import * as React from "react";

describe.assuming(inBrowser(), 'only in browser')('react root wrapper', () => {

    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    it("works with empty", () => {
        @properties
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root"/>
            }
        }
        const {select} = clientRenderer.render(<Comp />);

        expect(select('Root')).to.have.attribute('class', '');
    });

    it("use the rootProps function to process props (detect by behavior)", () => {

        type Props = {
            'data-automation-id'?: string;
            'data-x'?: string;
            'data-1'?: string;
            'data-2'?: string;
        };

        @properties(['data-1'])
        class Comp extends React.Component<Props> {
            render() {
                return <div data-automation-id="Root" data-x="overriden" data-2="2"/>
            }
        }

        const {select} = clientRenderer.render(<Comp data-x="test" data-1="1" data-automation-id="custom"/>);

        expect(select('custom')).to.equal(select('Root'));
        expect(select('Root')).to.have.attribute('data-x', 'test');
        expect(select('Root')).to.not.have.attribute('data-1');
        expect(select('Root')).to.have.attribute('data-2', '2');
    });

});
