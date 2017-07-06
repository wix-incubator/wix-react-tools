import {expect} from "test-drive";
import {getHeritage} from "./test-tools";

describe("getHeritage", () => {
    class Foo {
    }
    class Bar extends Foo {
    }
    class Baz extends Bar {
    }
    it("works on single class", () => {
        expect(getHeritage(Foo)).to.eql([Foo]);
    });
    it("works on real chain", () => {
        expect(getHeritage(Baz)).to.eql([Foo, Bar, Baz]);
    });
});
