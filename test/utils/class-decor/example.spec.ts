import {resetAll, spyAll} from "../../test-tools";
import {onInstance} from "../../../src/utils/class-decor";
import {expect} from "test-drive";

let globalConsole = console;
describe('class-decor documentation examples', () => {
    const console = spyAll({
        log: globalConsole.log,
        warn: globalConsole.warn,
    });

    afterEach("reset console.warn", () => {
        resetAll(console);
    });

    function expectLog(...lines: Array<string>) {
        expect(console.log).to.have.callCount(lines.length);
        lines.forEach((val: string, idx: number) => {
            expect(console.log.getCall(idx).args[0], `call #${idx} argument`).eql(val);
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
            const instance = new Logger('MyLogger');
            expectUnorderedLog(
                `inited logger: MyLogger`,
                `called on constructor with "MyLogger"`
            );
            debugger;
            expect(instance).to.be.instanceOf(Logger);
        });
    });
});
