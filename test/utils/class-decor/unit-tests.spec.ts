import { expect } from "test-drive-react";
import { before as beforeMethod, after, middleware } from "../../../src/";

describe("Unit tests - method hooks", () => {
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
});
