import * as React from 'react';
import { expect, ClientRenderer } from 'test-drive-react';
import { spyAll, resetAll } from '../test-drivers/test-tools';
import { decorReact, CreateElementHook, CreateElementArgs } from '../../src/react-decor';

describe('react-decor', () => {
    const clientRenderer = new ClientRenderer();

    const console = spyAll({
        log: () => {
        }
    });

    afterEach("reset console.warn", () => {
        resetAll(console);
    });

    afterEach(() => {
        clientRenderer.cleanup();
    });

    const Comp: React.SFC<{ name: string }> = ({ name }) => (<div data-automation-id="root">
        <span data-automation-id="content">
            {name}
        </span>
    </div>);

    const hook:CreateElementHook = function(componentProps: { name: string }, args: CreateElementArgs<any>): CreateElementArgs<any> {
        console.log(args.elementProps['data-automation-id']);
        return args;
    };

    it('should wrap a react component, without any hooks', () => {
        const wrap = decorReact({});
        const WrappedComp = wrap(Comp);

        const { select } = clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only

        expect(select('root')).to.exist;
    });

    it('should allow adding a single hook (which prints every type of node rendered) to a stateless react component', () => {
        const wrap = decorReact({ nodes: [hook] });
        const WrappedComp = wrap(Comp);

        clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only

        expect(console.log).to.have.callCount(2);
    });

    it('should allow adding multiple hooks to a stateless react component', () => {
        const wrap = decorReact({ nodes: [hook, hook] });
        const WrappedComp = wrap(Comp);

        clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only

        expect(console.log).to.have.callCount(4);
    });
});
