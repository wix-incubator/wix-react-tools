import {after, before, middleware} from "../../src";
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

    describe('by default creates a method if none previously exists', () => {
        it('before', () => {
            @before(beforeHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('after', () => {
            @after(afterHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('middleware', () => {
            @middleware(middlewareHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
    });

    describe('with .ifExists, does not create a method if none previously exists', () => {
        it('before', () => {
            @before.ifExists(beforeHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
        it('after', () => {
            @after.ifExists(afterHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
        it('middleware', () => {
            @middleware.ifExists(middlewareHook, 'myMethod')
            class Logger {
                myMethod: () => void;
            }
            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
    });

    describe('with .ifExists, wraps a method if it previously exists', () => {
        it('before', () => {
            @before.ifExists(beforeHook, 'myMethod')
            class Logger {
                myMethod() {
                };
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('after', () => {
            @after.ifExists(afterHook, 'myMethod')
            class Logger {
                myMethod() {
                };
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('middleware', () => {
            @middleware.ifExists(middlewareHook, 'myMethod')
            class Logger {
                myMethod() {
                };
            }
            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
    });
});
