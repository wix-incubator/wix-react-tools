import {expect, sinon} from "test-drive-react";
import {before as beforeMethod, middleware, runInContext, FlagsContext} from "../../../src/";

describe("Unit tests - method hooks", () => {
    let warn = console.warn;
    beforeEach("replace console.warn with spy", () => {
        console.warn = sinon.spy();
    });

    afterEach("reset console.warn", () => {
        console.warn = warn;
    });

    it("lets you add hooks for non-existent functions - before", () => {
        @beforeMethod<Duck>((instance, methodArgs) => {
            return methodArgs;
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        expect(() => {
            duck.duckWillQuack();
        }).not.to.throw();
    });

    it("lets you add hooks for non-existent functions - middlware", () => {
        @middleware<Duck>((instance, next, args) => {
            return next(args);
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        expect(() => {
            duck.duckWillQuack();
        }).not.to.throw();
    });

    it("warns you when a middleware doesn't call its 'next' function (iff enableChainBreaking is turned off)", () => {
        @middleware<Duck>((instance, next, args) => {
            //Don't call next()
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        runInContext<FlagsContext>({middlewareWarnWhenChainBreaking:false},()=>{
            duck.duckWillQuack();
            expect(console.warn).to.have.not.been.called;
        });
    });
});
