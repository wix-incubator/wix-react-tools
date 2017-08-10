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
    .classA {
    
    }
`);
        @SBComponent(css)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="1">
                    <div data-automation-id="2" className="classA fooBar"></div>
                </div>
            }
        }
        const {select, container} = clientRenderer.render(<Comp></Comp>);
        expect(select('1')).to.equal(container.querySelector(`.${css.classes.root}`));
        expect(container.querySelectorAll(`.${css.classes.root}`)).to.have.length(1);
        expect(select('2')).to.equal(container.querySelector(`.${css.classes.classA}`));
        expect(select('2')).to.equal(container.querySelector(`.fooBar`));
        expect(container.querySelectorAll(`.${css.classes.classA}`)).to.have.length(1);
    });

    it('supports style state', () => {
        const css = fromCSS(`
    .root {
        -st-state:a,b;
    }
    .classA {
        -st-state:x,y;
    }
`);
        const state = {x:true, y:false};
        const rootState = {a:true, b:false};
        const stateAttrName = Object.keys(css.cssStates(state))[0];
        const rootStateAttrName = Object.keys(css.cssStates(rootState))[0];

        @SBComponent(css)
        class Comp extends React.Component {
            render() {
                return <div data-automation-id="1" cssStates={{a:true, b:false}}>
                    <div data-automation-id="2" className="classA" cssStates={state}></div>
                </div>
            }
        }
        const {select} = clientRenderer.render(<Comp ></Comp>);

        expect(select('1')!.attributes.getNamedItem(rootStateAttrName)).to.be.ok;
        expect(select('2')!.attributes.getNamedItem(stateAttrName)).to.be.ok;
        expect(new Comp().render().props).to.not.haveOwnProperty('cssState');
        expect(new Comp().render().props.children.props).to.not.haveOwnProperty('cssState');

    });
});
