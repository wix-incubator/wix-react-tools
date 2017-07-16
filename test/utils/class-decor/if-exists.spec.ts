import {middleware, before, after} from "../../../src/";
import {expect, sinon} from "test-drive";

describe('middleware, before, after', () => {
    const spy = sinon.spy();

    afterEach("reset console.warn", () => {
        spy.reset();
    });
    function middlewareHook(instance: any, next: (...args: any[]) => any, methodArguments: any[]) {
        spy();
        return next(...methodArguments);
    }

    function beforeHook(instance: any, methodArguments: any[]) {
        spy();
        return methodArguments;
    }

    function afterHook(instance: any, methodResult: any) {
        spy();
        return methodResult;
    }

    it('by default creates a method if none previously exists', () => {
        @middleware(middlewareHook, 'myMethod')
        @before(beforeHook, 'myMethod')
        @after(afterHook, 'myMethod')
        class Logger {
            myMethod:()=>void;
        }
        const logger = new Logger();
        logger.myMethod();
        expect(spy).to.have.callCount(3);
    });

    it('with .ifExists, does not create a method if none previously exists', () => {
        @middleware.ifExists(middlewareHook, 'myMethod')
        @before.ifExists(beforeHook, 'myMethod')
        @after.ifExists(afterHook, 'myMethod')
        class Logger {
            myMethod:()=>void;
        }
        const logger = new Logger();
        expect(logger.myMethod).to.equal(undefined);
    });

    it('with .ifExists, wraps a method if it previously exists', () => {
        @middleware.ifExists(middlewareHook, 'myMethod')
        @before.ifExists(beforeHook, 'myMethod')
        @after.ifExists(afterHook, 'myMethod')
        class Logger {
            myMethod(){};
        }
        const logger = new Logger();
        logger.myMethod();
        expect(spy).to.have.callCount(3);
    });
});
