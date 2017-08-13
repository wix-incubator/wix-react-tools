import {SBComponent} from "stylable-react-component";
import {fromCSS} from "stylable";
import {ClientRenderer, expect} from "test-drive-react";
import * as React from "react";
import {inBrowser} from "mocha-plugin-env";


describe.assuming(inBrowser(), 'only in browser')('stylable-react', () => {

    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    it('supports class names', () => {

        const css = fromCSS(`
    .SomeClass {
    
    }
`);
        @SBComponent(css)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root">
                    <div data-automation-id="Node" className="SomeClass External"></div>
                </div>
            }
        }
        const {select, container} = clientRenderer.render(<Comp></Comp>);

        expect(select('Root')).to.equal(container.querySelector(`.${css.classes.root}`));
        expect(container.querySelectorAll(`.${css.classes.root}`)).to.have.length(1);
        expect(select('Node')).to.equal(container.querySelector(`.${css.classes.SomeClass}`));
        expect(select('Node')).to.equal(container.querySelector(`.External`));
        expect(container.querySelectorAll(`.${css.classes.SomeClass}`)).to.have.length(1);
    });

    it('supports style state', () => {
        const css = fromCSS(`
    .root {
        -st-state:a,b;
    }
    .SomeClass {
        -st-state:x,y;
    }
`);
        const rootState = {a:true, b:false};
        const rootStateAttrName = Object.keys(css.cssStates(rootState))[0]; // css.cssStates(...) will only have keys for states which are true
        const nodeState = {x:true, y:false};
        const nodeStateAttrName = Object.keys(css.cssStates(nodeState))[0];

        @SBComponent(css)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="Root" cssStates={rootState}>
                    <div data-automation-id="Node" className="SomeClass" cssStates={nodeState}></div>
                </div>
            }
        }
        const {select} = clientRenderer.render(<Comp ></Comp>);

        expect(select('Root')!.attributes.getNamedItem(rootStateAttrName)).to.be.ok;
        expect(select('Node')!.attributes.getNamedItem(nodeStateAttrName)).to.be.ok;
        expect(new Comp().render().props).to.not.haveOwnProperty('cssState'); // delete original cssStates from render result
        expect(new Comp().render().props.children.props).to.not.haveOwnProperty('cssState'); // delete original cssStates from render result

    });
});
