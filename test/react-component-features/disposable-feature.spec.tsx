import * as React from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {disposable, Disposers} from "../../src";
import {inBrowser} from "mocha-plugin-env/dist/src";

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
        return <div />;
    }
}


describe.assuming(inBrowser(), 'only in browser')("disposable decorator", () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    it('called on unmount', () => {
        let sinonSpy = sinon.spy();
        const {container} = clientRenderer.render(<div />);

        clientRenderer.render(<div><DisposableComp hook={sinonSpy} /></div>, container);
        expect(sinonSpy).to.have.callCount(0);

        clientRenderer.render(<div />, container);
        expect(sinonSpy).to.have.callCount(1);
    });
});
