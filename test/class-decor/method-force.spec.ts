import {classDecor, functionDecor} from "../../src";
import {expect, sinon} from "test-drive";

describe('method forcing', () => {
    const spy = sinon.spy();

    afterEach("reset console.warn", () => {
        spy.reset();
    });

    function middlewareHook(this: any, next: (...args: any[]) => any, methodArguments: any[]) {
        spy();
        return next(...methodArguments);
    }

    function beforeHook(this: any, methodArguments: any[]) {
        spy();
        return methodArguments;
    }

    function afterHook(this: any, methodResult: any) {
        spy();
        return methodResult;
    }

    describe('.method does not create a method if none previously exists', () => {
        it('functionDecor.before', () => {
            @classDecor.method<Logger>('myMethod', functionDecor.before(beforeHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
        it('functionDecor.after', () => {

            @classDecor.method<Logger>('myMethod', functionDecor.after(afterHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
        it('functionDecor.middleware', () => {
            @classDecor.method<Logger>('myMethod', functionDecor.middleware(middlewareHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            expect(logger.myMethod).to.equal(undefined);
        });
    });

    describe('.forceMethod creates a method if none previously exists', () => {
        it('functionDecor.before', () => {
            @classDecor.forceMethod<Logger>('myMethod', functionDecor.before(beforeHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('functionDecor.after', () => {

            @classDecor.forceMethod<Logger>('myMethod', functionDecor.after(afterHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('functionDecor.middleware', () => {
            @classDecor.forceMethod<Logger>('myMethod', functionDecor.middleware(middlewareHook))
            class Logger {
                myMethod: () => void;
            }

            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
    });

    describe('.forceMethod wraps a method if it previously exists', () => {
        it('functionDecor.before', () => {
            @classDecor.forceMethod<Logger>('myMethod', functionDecor.before(beforeHook))
            class Logger {
                myMethod() {
                };
            }

            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('functionDecor.after', () => {
            @classDecor.forceMethod<Logger>('myMethod', functionDecor.after(afterHook))
            class Logger {
                myMethod() {
                };
            }

            const logger = new Logger();
            logger.myMethod();
            expect(spy).to.have.callCount(1);
        });
        it('functionDecor.middleware', () => {
            @classDecor.forceMethod<Logger>('myMethod', functionDecor.middleware(middlewareHook))
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
