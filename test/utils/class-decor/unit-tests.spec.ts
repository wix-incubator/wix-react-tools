import {expect, sinon} from "test-drive-react";
import {before, middleware, runInContext, FlagsContext} from "../../../src/";

describe("Unit tests - method hooks", () => {
    let warn = console.warn;
    beforeEach("replace console.warn with spy", () => {
        console.warn = sinon.spy();
    });

    afterEach("reset console.warn", () => {
        console.warn = warn;
    });

    it("lets you add hooks for non-existent functions - before", () => {
        @before<Duck>((instance, methodArgs) => {
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

    it("warns you when a middleware doesn't call its 'next' function (iff middlewareWarnWhenChainBreaking is turned ON)", () => {
        @middleware<Duck>(function badLeeroyBrown(){
            //Don't call next()
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        runInContext<FlagsContext>({middlewareWarnWhenChainBreaking:true},()=>{
            duck.duckWillQuack();
            expect(console.warn).to.have.callCount(1);
            expect(console.warn).to.have.been.calledWithMatch(/\@middleware/);
            expect(console.warn).to.have.been.calledWithMatch(/badLeeroyBrown/);
            expect(console.warn).to.have.been.calledWithMatch(/Duck.duckWillQuack/);
        });
    });

    it("doesn't warn you when a middleware DOES call its 'next' function (iff middlewareWarnWhenChainBreaking is turned ON)", () => {
        @middleware<Duck>((instance, next, args) => {
            next(args);
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        runInContext<FlagsContext>({middlewareWarnWhenChainBreaking:true},()=>{
            duck.duckWillQuack();
            expect(console.warn).to.have.callCount(0);
        });
    });

    it("doesn't warn you when a middleware doesn't call its 'next' function (iff middlewareWarnWhenChainBreaking is turned OFF)", () => {
        @middleware<Duck>(() => {
            //Don't call next()
        }, "duckWillQuack")
        class Duck {
            duckWillQuack: () => void;
        }
        let duck = new Duck();

        runInContext<FlagsContext>({middlewareWarnWhenChainBreaking:false},()=>{
            duck.duckWillQuack();
            expect(console.warn).to.have.callCount(0);
        });
    });
});
