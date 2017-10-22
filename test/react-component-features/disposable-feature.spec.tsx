import * as React from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {disposable, Disposers} from "../../src";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {runInContext} from "../../src/core/config";
import {devMode} from "../../src/core/dev-mode";

interface Props {
    hook: Function
}

@disposable
class DisposableComp extends React.Component<Props, any> implements disposable.This {

    readonly disposer: Disposers;

    componentDidMount() {
        this.disposer.set('myHook', this.props.hook);
    }

    render() {
        return <div/>;
    }
}

describe.assuming(inBrowser(), 'only in browser')("disposable decorator", () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => runInContext(devMode.OFF, () => clientRenderer.cleanup()));

    it('called on unmount', () => {
        const spy = sinon.spy();
        const {container} = clientRenderer.render(<div/>);

        clientRenderer.render(<div><DisposableComp hook={spy}/></div>, container);
        expect(spy).to.have.callCount(0);

        clientRenderer.render(<div/>, container);
        expect(spy).to.have.callCount(1);
    });
});
