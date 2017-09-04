import * as React from "react";
import {SFC} from "react";
import {ClientRenderer, expect, sinon} from "test-drive-react";
import {resetAll, spyAll} from "../test-drivers/test-tools";
import {inBrowser} from "mocha-plugin-env/dist/src";
import {decorReactFunc} from "../../src/react-decor/react-decor-function";
import {ElementArgs, ElementHook} from "../../src/react-decor/common";
import {runInContext} from "../../src/core/config";
import {GlobalConfig} from "../../src/core/types";

const _console = console;
describe.assuming(inBrowser(), 'only in browser')('react-decor-function', () => {
    const clientRenderer = new ClientRenderer();

    const console = spyAll({
        log: () => {
        }
    });

    afterEach("cleanup and reset console.log", () => {
        resetAll(console);
        clientRenderer.cleanup();
    });

    type PropsWithName = { name: string };

    const Comp: React.SFC<PropsWithName> = ({name}) => (
        <div data-delete-me="TBDeleted" data-change-me="TBChanged">
            <span data-automation-id="content">
                {name}
            </span>
        </div>
    );

    const elementHook: ElementHook<PropsWithName> = function (instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
        console.log(args.elementProps['data-automation-id']);
        return args;
    };

    it('should wrap a react component, without any hooks', () => {
        const wrap = decorReactFunc<PropsWithName>({});
        const WrappedComp = wrap(Comp);

        const {select} = clientRenderer.render(<WrappedComp name="Jon"/>); // todo: maybe fix currently client only
        const content = select('content');

        expect(content).to.be.ok;
        expect((content as HTMLSpanElement).innerText).to.equal('Jon');
    });

    describe('react SFC fields', () => {
        it('should copy react SFC fields', () => {
            const Comp: SFC = () => <div />;
            Comp.propTypes = {};
            Comp.contextTypes = {};
            Comp.defaultProps = {};
            Comp.displayName = 'foo';

            const wrap = decorReactFunc<PropsWithName>({});
            const WrappedComp = wrap(Comp);

            expect(WrappedComp.propTypes).to.equal(Comp.propTypes);
            expect(WrappedComp.contextTypes).to.equal(Comp.contextTypes);
            expect(WrappedComp.defaultProps).to.equal(Comp.defaultProps);
            expect(WrappedComp.displayName).to.equal(Comp.displayName);
        });

        it('should copy name to displayName if original comp has no displayName', () => {
            const Comp: SFC = function foo() {
                return <div />;
            };

            runInContext({devMode: true}, () => {
                const wrap = decorReactFunc<PropsWithName>({});
                const WrappedComp = wrap(Comp);

                expect(WrappedComp.displayName).to.equal(Comp.name);
            });
        });
    });

    describe('node hooks', () => {
        it('should allow adding a single node hook (which prints every type of node rendered) to a stateless react component', () => {
            const wrap = decorReactFunc({onEachElement: [elementHook]});
            const WrappedComp = wrap(Comp);

            clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(console.log).to.have.callCount(2);
            expect(console.log).to.have.been.calledWith(undefined); // no data-automation-id for root
            expect(console.log).to.have.been.calledWithMatch(/content/);
        });

        it('should allow adding multiple nodes hooks to a stateless react component', () => {
            const wrap = decorReactFunc({onEachElement: [elementHook, elementHook]});
            const WrappedComp = wrap(Comp);

            clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(console.log).to.have.callCount(4);
            expect(console.log.getCall(0)).to.have.been.calledWithMatch(/content/);
            expect(console.log.getCall(1)).to.have.been.calledWithMatch(/content/);
            expect(console.log.getCall(2)).to.have.been.calledWith(undefined); // second hook, no root id
            expect(console.log.getCall(3)).to.have.been.calledWith(undefined); // first hook, no root id
        });

        it('should allow adding a node hook to a stateless component that will add/remove/change the element props', () => {
            let index = 0;

            function multiActionNodeHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
                args.elementProps['data-automation-id'] = index;
                args.elementProps['data-change-me'] = componentProps.name + index;
                args.elementProps['data-delete-me'] = undefined;
                index++;
                return args;
            }

            const wrap = decorReactFunc({onEachElement: [multiActionNodeHook]});
            const WrappedComp = wrap(Comp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('0')).to.be.ok; // add attribute
            expect(select('1')).to.be.ok;
            expect(select('0')).to.not.have.attribute('data-delete-me'); // remove attribute
            expect(select('1')).to.not.have.attribute('data-delete-me');
            expect(select('0')).to.have.attribute('data-change-me', 'Jon0'); // change/add attribute
            expect(select('1')).to.have.attribute('data-change-me', 'Jon1');
        });
    });

    describe('root hooks', () => {
        let warn = _console.warn;
        beforeEach("replace console.warn with spy", () => {
            _console.warn = sinon.spy();
        });

        afterEach("reset console.warn", () => {
            _console.warn = warn;
        });


        function rootHook(instance: null, componentProps: PropsWithName, args: ElementArgs<any>): ElementArgs<any> {
            args.elementProps['data-automation-id'] = 'root';
            args.elementProps['data-change-me'] = componentProps.name;
            args.elementProps['data-delete-me'] = undefined;
            return args;
        }

        it('should allow adding a single root hook to a stateless component that will add/remove/change the root elements props', () => {
            const wrap = decorReactFunc({onRootElement: [rootHook]});
            const WrappedComp = wrap(Comp);

            const {select} = clientRenderer.render(<WrappedComp name="Jon"/>);

            expect(select('root')).to.be.ok;
            expect(select('root')).to.not.have.attribute('data-delete-me');
            expect(select('root')).to.have.attribute('data-change-me', 'Jon');
            expect(select('content')).to.be.ok;
        });
        it('warns on unknown root in dev mode', () => {
            runInContext<GlobalConfig>({devMode: true}, () => {
                const result = <div />;
                const Comp: SFC = () => result;
                const wrap = decorReactFunc({onRootElement: [rootHook]});
                const WrappedComp = wrap(Comp);
                WrappedComp({name:''});
                expect(_console.warn).to.have.callCount(1);
                expect(_console.warn).to.have.been.calledWithMatch(/unexpected root/);
            });
        });

        it('does not warn on unknown root out of dev mode', () => {
            runInContext<GlobalConfig>({devMode: false}, () => {
                const result = <div />;
                const Comp: SFC = () => result;
                const wrap = decorReactFunc({onRootElement: [rootHook]});
                const WrappedComp = wrap(Comp);
                WrappedComp({name:''});
                expect(_console.warn).to.have.callCount(0);
            });
        });
        it('does not warn on unknown root if null', () => {
            runInContext<GlobalConfig>({devMode: true}, () => {
                const Comp: SFC = () => null;
                const wrap = decorReactFunc({onRootElement: [rootHook]});
                const WrappedComp = wrap(Comp);
                WrappedComp({name:''});
                expect(_console.warn).to.have.callCount(0);
            });
        });
    });
});
