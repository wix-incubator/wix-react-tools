import * as React from 'react';
import { expect, ClientRenderer } from 'test-drive-react';
import { spyAll, resetAll } from '../test-drivers/test-tools';
import { inBrowser } from "mocha-plugin-env/dist/src";
import { decorReact, ElementHook, ElementArgs, CreateElementArgsTuple, translateArgumentsToObject, translateObjectToArguments } from '../../src/react/react-decor-function';

describe.assuming(inBrowser(), 'only in browser')('react-decor', () => {
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

    const Comp: React.SFC<{ name: string }> = ({ name }) => (<div data-delete-me="TBDeleted" data-change-me="TBChanged">
        <span data-automation-id="content">
            {name}
        </span>
    </div>);

    const nodeHook: ElementHook = function (componentProps: { name: string }, args: ElementArgs<any>): ElementArgs<any> {
        console.log(args.elementProps['data-automation-id']);
        return args;
    };

    it('should wrap a react component, without any hooks', () => {
        const wrap = decorReact({});
        const WrappedComp = wrap(Comp);

        const { select } = clientRenderer.render(<WrappedComp name="Jon" />); // todo: maybe fix currently client only
        const content = select('content');

        expect(content).to.be.ok;
        expect((content as HTMLSpanElement).innerText).to.equal('Jon');
    });

    describe('node hooks', () => {
        it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
            const wrap = decorReact({ nodes: [nodeHook] });
            const WrappedComp = wrap(Comp);

            clientRenderer.render(<WrappedComp name="Jon" />);

            expect(console.log).to.have.callCount(2);
        });

        it('should allow adding multiple nodes hooks to a stateless react component', () => {
            const wrap = decorReact({ nodes: [nodeHook, nodeHook] });
            const WrappedComp = wrap(Comp);

            clientRenderer.render(<WrappedComp name="Jon" />);

            expect(console.log).to.have.callCount(4);
        });
    });

    describe('root hooks', () => {
        function rootHook(componentProps: { name: string }, args: ElementArgs<any>): ElementArgs<any> {
            args.elementProps['data-automation-id'] = 'root';
            args.elementProps['data-change-me'] = componentProps.name;
            args.elementProps['data-delete-me'] = undefined;
            return args;
        }

        it('should allow adding a single root hook to a stateless component', () => {
            const wrap = decorReact({ root: [rootHook] });
            const WrappedComp = wrap(Comp);

            const { select } = clientRenderer.render(<WrappedComp name="Jon" />);

            expect(select('root')).to.be.ok;
            expect(select('root')).to.not.have.attribute('data-delete-me');
            expect(select('root')).to.have.attribute('data-change-me', 'Jon');
        });
    });
});
