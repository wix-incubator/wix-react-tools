import {expect} from "test-drive-react";
import {cachedChainFunctions, rootProps} from "../../src";

// make a new function
function func() {
    return () => {

    };
}

describe('root', () => {
    it("does not copy everything", () => {
        const result = rootProps({
            foo: "foo"
        }, {
            bar: "bar",
            className: ""
        });
        expect(result).to.eql({className: "", bar: "bar"});
    });

    it("should merge empty objects", () => {
        const result = rootProps({}, {
            className: ""
        });
        expect(result).to.eql({className: ""});
    });

    describe("data-*", () => {
        it("should merge data attributes", () => {
            const result = rootProps({
                "data-x": "test"
            }, {
                "data-x": "overriden",
                className: ""
            });

            expect(result).to.eql({
                "data-x": "test",
                className: ""
            });
        });

        it("should combine different attributes", () => {
            const result = rootProps({
                "data-1": "1"
            }, {
                "data-2": "2",
                className: ""
            });

            expect(result).to.eql({
                "data-1": "1",
                "data-2": "2",
                className: ""
            });
        });

        it("should respect black-list", () => {
            const result = rootProps({
                "data-1": "1",
                "data-x": "test"
            }, {
                "data-2": "2",
                "data-x": "overriden",
                className: ""
            }, ['data-1']);

            expect(result).to.eql({
                "data-x": "test",
                "data-2": "2",
                className: ""
            });
        });
    });

    describe('data-automation-id', () => {
        const DAID = "data-automation-id";
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = rootProps({[DAID]: "foo"}, {className: "root"});
            expect(result).to.eql({[DAID]: "foo", className: "root"});
        });

        it("should maintain root data-automation-id even when component style is empty", () => {
            const result = rootProps({}, {[DAID]: "foo", className: "root"});
            expect(result).to.eql({[DAID]: "foo", className: "root"});
        });
        it("should concatenate data-automation-ids", () => {
            const result = rootProps({
                [DAID]: "foo"
            }, {
                [DAID]: "bar",
                className: ""
            });

            expect(result).to.eql({[DAID]: "bar foo", className: ""});
        });
    });

    describe('className', () => {
        it("should throw if no className provided in rootProps", () => {
            expect(() => rootProps({}, {} as any)).to.throw(Error, 'className');
        });

        it("should concatenate classNames", () => {
            const result = rootProps({
                className: "blah"
            }, {
                className: "root"
            });

            expect(result).to.eql({className: "root blah"});
        });
    });

    describe('style', () => {
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = rootProps({style: {color: "green"}}, {className: "root"});

            expect(result).to.eql({style: {color: "green"}, className: "root"});
        });

        it("should maintain root style even when component style is empty", () => {
            const result = rootProps({}, {style: {color: "red"}, className: "root"});

            expect(result).to.eql({style: {color: "red"}, className: "root"});
        });

        it("should merge props", () => {
            const result = rootProps({
                style: {
                    color: "green"
                }
            }, {
                style: {
                    color: "red"
                },
                className: "root"
            });

            expect(result).to.eql({style: {color: "green"}, className: "root"});
        });
    });


    // removed disabled feature
    // https://github.com/wix/stylable-components/pull/144#issuecomment-320871672
    xdescribe('noevent handlers (on*)', () => {
        const f1 = func();
        const f2 = func();
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = rootProps({onFoo: f1}, {className: "root"});
            expect(result).to.eql({onFoo: f1, className: "root"});
        });

        it("should maintain root handlers even when component style is empty", () => {
            const result = rootProps({}, {onFoo: f1, className: "root"});
            expect(result).to.eql({onFoo: f1, className: "root"});
        });

        it("should merge handlers", () => {
            const result = rootProps({
                onFoo: f1
            }, {
                onFoo: f2,
                className: "root"
            });

            expect(result).to.eql({onFoo: cachedChainFunctions(f1, f2), className: "root"});
            expect(result.onFoo).to.equal(cachedChainFunctions(f1, f2)); // notice the use of .equal and *not* .eql
        });
    });
});
