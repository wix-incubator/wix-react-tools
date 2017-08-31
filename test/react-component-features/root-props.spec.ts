import {expect} from "test-drive-react";
import {rootProps} from "../../src/react-component-features/root-props";

describe('rootProps', () => {
    it("does not copy everything", () => {
        const result = rootProps({
            foo: "foo"
        }, {
            bar: "bar"
        });
        expect(result).to.eql({bar: "bar"});
    });

    it("should merge empty objects", () => {
        const result = rootProps({}, {});
        expect(result).to.eql({});
    });

    describe("data-*", () => {
        it("should merge data attributes", () => {
            const result = rootProps({
                "data-x": "test"
            }, {
                "data-x": "overriden"
            });

            expect(result).to.eql({
                "data-x": "test"
            });
        });

        it("should combine different attributes", () => {
            const result = rootProps({
                "data-1": "1"
            }, {
                "data-2": "2"
            });

            expect(result).to.eql({
                "data-1": "1",
                "data-2": "2"
            });
        });

        it("should respect black-list", () => {
            const result = rootProps({
                "data-1": "1",
                "data-x": "test"
            }, {
                "data-2": "2",
                "data-x": "overriden"
            }, ['data-1']);

            expect(result).to.eql({
                "data-x": "test",
                "data-2": "2"
            });
        });
    });

    describe('data-automation-id', () => {
        const DAID = "data-automation-id";
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = rootProps({[DAID]: "foo"}, {className: "root"});
            expect(result).to.eql({[DAID]: "foo", className: "root"});
        });

        it("should maintain root data-automation-id even when component data-automation-id is empty", () => {
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
            const result = rootProps({style: {color: "green"}}, {});

            expect(result).to.eql({style: {color: "green"}});
        });

        it("should maintain root style even when component style is empty", () => {
            const result = rootProps({}, {style: {color: "red"}});

            expect(result).to.eql({style: {color: "red"}});
        });

        it("should merge props", () => {
            const result = rootProps({
                style: {
                    color: "green"
                }
            }, {
                style: {
                    color: "red"
                }
            });

            expect(result).to.eql({style: {color: "green"}});
        });
    });

    describe('aria', () => {
        it("should assign aria-label componentProps to root if nothing exists on root", () => {
            const result = rootProps({['aria-label']: "foo"}, {});
            expect(result).to.eql({['aria-label']: "foo"});
        });
        it("should assign aria-labelledby componentProps to root if nothing exists on root", () => {
            const result = rootProps({['aria-labelledby']: "foo"}, {});
            expect(result).to.eql({['aria-labelledby']: "foo"});
        });
        it("should assign aria-describedby componentProps to root if nothing exists on root", () => {
            const result = rootProps({['aria-describedby']: "foo"}, {});
            expect(result).to.eql({['aria-describedby']: "foo"});
        });
    });

    // removed disabled feature
    // https://github.com/wix/stylable-components/pull/144#issuecomment-320871672
    // make a new function
    //     function func() {
    //         return () => {
    //
    //         };
    //     }
    // describe('noevent handlers (on*)', () => {
    //     const f1 = func();
    //     const f2 = func();
    //     it("should assign componentProps to root if nothing exists on root", () => {
    //         const result = rootProps({onFoo: f1}, {});
    //         expect(result).to.eql({onFoo: f1});
    //     });
    //
    //     it("should maintain root handlers even when component style is empty", () => {
    //         const result = rootProps({}, {onFoo: f1});
    //         expect(result).to.eql({onFoo: f1});
    //     });
    //
    //     it("should merge handlers", () => {
    //         const result = rootProps({
    //             onFoo: f1
    //         }, {
    //             onFoo: f2
    //         });
    //
    //         expect(result).to.eql({onFoo: cachedChainFunctions(f1, f2)});
    //         expect(result.onFoo).to.equal(cachedChainFunctions(f1, f2)); // notice the use of .equal and *not* .eql
    //     });
    // });
});
