import {resetAll, spyAll} from "./test-tools";
import {after, before, middleware} from "../src/function-decor";
import {expect} from "test-drive";


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
            function logMW(next: (n: string) => string, methodArguments: [string]) {
                console.log('called on method with ' + methodArguments[0]);
                const result: string = next('goodbye');
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

    });

});

