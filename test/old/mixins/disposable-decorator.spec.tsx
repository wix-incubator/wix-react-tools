import * as React from 'react';
import {expect, sinon, ClientRenderer} from 'test-drive-react';
import {Disposers,disposable} from "../../../src";
import {inBrowser} from "mocha-plugin-env/dist/src";


interface Props {
    hook: Function
}

@disposable
class DisposableComp extends React.Component<Props, any> {

    readonly disposer: Disposers;

    componentDidMount() {
        this.disposer.set('myHook', this.props.hook);
    }

    render() {
        return <div data-automation-id="test"></div>;
    }
}


describe.assuming(inBrowser(), 'only in browser')("disposable decorator", () => {
    const clientRenderer = new ClientRenderer();
    afterEach(() => clientRenderer.cleanup());

    it('called on unmount', () => {
        let sinonSpy = sinon.spy();
        const {container} = clientRenderer.render(<div></div>);

        clientRenderer.render(<div><DisposableComp hook={sinonSpy}></DisposableComp></div>, container);
        expect(sinonSpy).to.have.callCount(0);

        clientRenderer.render(<div></div>, container);
        expect(sinonSpy).to.have.callCount(1);
    });
});
