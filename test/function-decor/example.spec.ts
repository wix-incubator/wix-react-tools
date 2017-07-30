import {resetAll, spyAll} from "../test-drivers/test-tools";
import {expect} from "test-drive";
import {after, before, middleware, decorFunction, hookWrappers} from "../../src/index";


describe('function-decor documentation examples', () => {
    const console = spyAll({
        log: () => {
        },
        warn: () => {
        },
    });

    afterEach("reset console.warn", () => {
        resetAll(console);
    });

    function expectLog(...lines: Array<string>) {
        expect(console.log).to.have.callCount(lines.length);
        lines.forEach((val: string, idx: number) => {
            expect(console.log.getCall(idx).args, `call #${idx} argument`).eql([val]);
        });
    }

    describe('wrapper', () => {

        function original(text: string): string {
            console.log(text);
            return 'message printed: ' + text;
        }


        it('middleware', () => {
            function logMW(next: (n: [string]) => string, methodArguments: [string]): string {
                console.log('called on method with ' + methodArguments[0]);
                const result: string = next(['goodbye']);
                console.log(result);
                return 'wrapped=> ' + result
            }

            const enhanceWithLogMW = middleware(logMW);
            const enhanced = enhanceWithLogMW(original);

            const result: string = enhanced('hello');
            expectLog(
                `called on method with hello`,
                `goodbye`,
                `message printed: goodbye`
            );
            expect(result).to.eql('wrapped=> message printed: goodbye');
        });


        it('before', () => {
            function preMethod(methodArguments: [string]) {
                console.log('called before method with ' + methodArguments[0]);
                return ['goodbye'];
            }

            const wrap = before(preMethod);
            const printMessage = wrap(original);

            const result = printMessage('hello');
            expectLog(
                `called before method with hello`,
                `goodbye`
            );
            expect(result).to.eql('message printed: goodbye');
        });

        it('after', () => {
            function postMethod(methodReturn: string) {
                console.log(methodReturn);
                return 'wrapped=> ' + methodReturn;
            }

            const wrap = after(postMethod);
            const printMessage = wrap(original);

            const result = printMessage('hello');
            expectLog(
                `hello`,
                `message printed: hello`
            );
            expect(result).to.eql('wrapped=> message printed: hello');
        });

        describe('multiple wrappers', () => {
            function beforePrintMethod(methodArguments: [string]): [string] {
                const id = ((+methodArguments[0]) + 1) + ''; // cast to number, increase and cast back to string
                console.log('before ' + id);
                return [id];
            }

            function afterPrintMethod(methodReturn: string) {
                let lastChar = methodReturn.substr(methodReturn.length - 1); // trims to passed number only
                const id = ((+lastChar) + 1) + ''; // cast to number, increase and cast back to string
                console.log('after ' + id);
                return id;
            }

            function middlewarePrintMethod(next: (n: [string]) => void, methodArguments: [string]): string {
                let str = methodArguments[0];
                const id = ((+str) + 1) + ''; // cast to number, increase and cast back to string
                console.log('middleware before ' + id);
                next([id]); // because dynamic number of arguments in generic functions?
                console.log('middleware after ' + id);
                return id;
            }



            it('should be able to wrap multiple before/after/middleware functions', () => {
                const wrappers:hookWrappers = {
                    middleware: [
                        middlewarePrintMethod,
                        middlewarePrintMethod
                    ],
                    before: [
                        beforePrintMethod,
                        beforePrintMethod
                    ],
                    after: [
                        afterPrintMethod,
                        afterPrintMethod
                    ]
                };

                const enhanced = decorFunction(wrappers)(original);

                const res = enhanced('0');

                expectLog(
                    'before 1', // befores
                    'before 2',
                    'middleware before 3', // middlewares
                    'middleware before 4',
                    '4', // original function
                    'middleware after 4',
                    'middleware after 3',
                    'after 4', // afters
                    'after 5',
                );
            });
        });
    });
});
