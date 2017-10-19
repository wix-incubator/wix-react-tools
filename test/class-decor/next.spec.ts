import {resetAll, spyAll} from "../test-drivers/test-tools";
import {defineProperties, middleware, onInstance} from "../../src";
import {expect} from "test-drive";
import {classDecor, forceMethod, makeClassDecorMetadata} from "../../src/class-decor/next";

describe('next class-decor documentation examples', () => {
    let log: string[] = [];
    const console = spyAll({
        log: (...args: string[]) => {
            log.push(args.join(' '));
        },
        warn: () => {
        },
    });

    afterEach("reset console.warn", () => {
        log = [];
        resetAll(console);
    });

    function expectLog(...lines: Array<any>) {
        expect(JSON.stringify(log)).to.eql(JSON.stringify(lines));
        expect(console.log).to.have.callCount(lines.length);
        lines.forEach((val: string, idx: number) => {
            expect(console.log.getCall(idx).args, `call #${idx} argument`).eql([val]);
        });
    }

    function expectUnorderedLog(...lines: Array<string>) {
        expect(console.log).to.have.callCount(lines.length);
        lines.forEach((val: string) => {
            expect(console.log).to.have.been.calledWithExactly(val);
        });
    }

    describe('onInstance', () => {
        it('directly on class', () => {
            function init(this: Logger, constructorArguments: [string]) {
                console.log('called on constructor with "' + constructorArguments[0] + '"');
            }

            @classDecor.makeWrapper(makeClassDecorMetadata([init], null, null))
            class Logger {
                constructor(name: string) {
                    console.log('inited logger: ' + name);
                }
            }

            const logger = new Logger('MyLogger');
            expectUnorderedLog(
                `inited logger: MyLogger`,
                `called on constructor with "MyLogger"`
            );
            expect(logger).to.be.instanceOf(Logger);
        });
    });

    describe('method', () => {
        let context: any;

        function logMW(this: any, next: (n: [string]) => string, methodArguments: [string]) {
            context = this;
            console.log('called on method with ' + methodArguments[0]);
            next(['goodbye']);
        }

        const hook = middleware(logMW);

        it('wraps existing method', () => {
            @classDecor.makeWrapper(makeClassDecorMetadata(null, {
                printMessage: [hook]
            }, null))
            class Logger {
                printMessage(text: string) {
                    console.log(text);
                }
            }

            const logger = new Logger();
            logger.printMessage('hello');
            expect(context).to.equal(logger);
            expectLog(
                `called on method with hello`,
                `goodbye`
            );
        });

        it('with no method (no force)', () => {
            @classDecor.makeWrapper(makeClassDecorMetadata(null, null, {
                printMessage: [hook]
            }))
            class Logger {
            }

            expect((new Logger() as any).printMessage).to.equal(undefined);
        });

        it('with no method (force)', () => {
            @classDecor.makeWrapper(makeClassDecorMetadata(null, {
                printMessage: forceMethod(hook)
            }, null))
            class Logger {
                // merely define the method in the type system, do not create it
                printMessage: (text: string) => string;
            }

            const logger = new Logger();
            logger.printMessage('hello');
            expect(context).to.equal(logger);
            expectLog(`called on method with hello`);
        });
    });

    describe('define properties', () => {
        it('directly on class', () => {
            function printMessage(text: string) {
                console.log(text);
            }

            @classDecor.makeWrapper(makeClassDecorMetadata(null, null, {
                printMessage: {
                    set: printMessage,
                }
            }))
            class Logger {
                printMessage: string;
            }

            const logger = new Logger();
            logger.printMessage = 'hello';
            expectLog(
                `hello`
            );
        });
    });
});
