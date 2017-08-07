import {resetAll, spyAll} from "../test-drivers/test-tools";
import {add, after, before, middleware, onInstance} from "../../src";
import {expect} from "test-drive";

describe('class-decor documentation examples', () => {
    let log:string[] = [];
    const console = spyAll({
        log: (...args:string[]) => {
            log.push(args.join(' '));
        },
        warn: () => {
        },
    });

    afterEach("reset console.warn", () => {
        log = [];
        resetAll(console);
    });

    function expectLog(...lines: Array<string>) {
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
            function init(instance: Logger, constructorArguments: [string]) {
                console.log('called on constructor with "' + constructorArguments[0] + '"');
            }

            @onInstance(init)
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

    describe('middleware', () => {
        it('directly on class', () => {
            function logMW(instance: Logger, next: (n: [string]) => string, methodArguments: [string]) {
                console.log('called on method with ' + methodArguments[0]);
                const result: string = next(['goodbye']);
                console.log(result);
                return 'wrapped=> ' + result
            }

            @middleware(logMW, 'printMessage')
            class Logger {
                printMessage(text: string) {
                    console.log(text);
                    return 'message printed: ' + text;
                }
            }
            const logger = new Logger();
            const result = logger.printMessage('hello');
            expectLog(
                `called on method with hello`,
                `goodbye`,
                `message printed: goodbye`
            );
            expect(result).to.eql('wrapped=> message printed: goodbye');
        });
    });

    describe('before', () => {
        it('directly on class', () => {
            function preMethod(instance: Logger, methodArguments: [string]) {
                console.log('called before method with ' + methodArguments[0]);
                return ['goodbye'];
            }

            @before(preMethod, 'printMessage')
            class Logger {
                printMessage(text: string) {
                    console.log(text);
                    return 'message printed: ' + text;
                }
            }
            const logger = new Logger();
            const result = logger.printMessage('hello');
            expectLog(
                `called before method with hello`,
                `goodbye`
            );
            expect(result).to.eql('message printed: goodbye');
        });
    });

    describe('after', () => {
        it('directly on class', () => {
            function postMethod(instance: Logger, methodReturn: string) {
                console.log(methodReturn);
                return 'wrapped=> ' + methodReturn;
            }

            @after(postMethod, 'printMessage')
            class Logger {
                printMessage(text: string) {
                    console.log(text);
                    return 'message printed: ' + text;
                }
            }

            const logger = new Logger();
            const result = logger.printMessage('hello');
            expectLog(
                `hello`,
                `message printed: hello`
            );
            expect(result).to.eql('wrapped=> message printed: hello');
        });
    });

    describe('add', () => {
        it('directly on class', () => {
            function printMessage(text: string) {
                console.log(text);
                return 'message printed: ' + text;
            }

            @add({printMessage})
            class Logger {
                printMessage: (text: string) => string;
            }
            const logger = new Logger();
            const result = logger.printMessage('hello');
            expectLog(
                `hello`
            );
            expect(result).to.eql('message printed: hello');
        });
    });
});
