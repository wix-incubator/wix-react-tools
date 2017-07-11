import {expect} from 'test-drive-react';
import {getHeritage} from "../../test-tools";
import {
    after,
    before as beforeMethod,
    onInstance} from "../../../src/utils/class-decor";
import {chain, middleware} from "../../../src/utils/class-decor";

const METHOD = 'myMethod';

class Foo {
    myMethod(){}
}
describe("class decor side-effect", () => {
        const decorate = chain<Foo>(
            onInstance<Foo>(() => undefined),
            beforeMethod<Foo>(() => undefined, METHOD),
            after<Foo>(() => undefined, METHOD),
            middleware<Foo>(() => undefined, METHOD));

        // fixture class tree
        @decorate @decorate @decorate
        class Bar extends Foo {
        }
        @decorate @decorate @decorate
        class Biz extends Bar {
        }
        class Baz extends Biz {
        }
        const NUM_USER_CLASSES = 3; // [Bar, Biz, Baz].length

        it('only add one class to heritage', () => {
            expect(getHeritage(Baz).length).to.eql(getHeritage(Foo).length + NUM_USER_CLASSES + 1);
        });

        it('does not change constructor name(s)', () => {
            expect(new Bar().constructor.name, 'new Bar().constructor.name').to.equal('Bar');
            expect(new Biz().constructor.name, 'new Biz().constructor.name').to.equal('Biz');
            expect(new Baz().constructor.name, 'new Baz().constructor.name').to.equal('Baz');
        });
});
