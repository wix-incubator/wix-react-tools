import {expect} from 'test-drive-react';
import {root, mergeEventHandlers} from '../../src';

// make a new function
function func() {
    return () => {

    };
}

describe('root', () => {
    it("does not copy everything", () => {
        const result = root({
            foo: "foo"
        }, {
            bar: "bar",
            className: ""
        });
        expect(result).to.eql({className: "", bar: "bar"});
    });

    describe("data-*", () => {
        it("should merge empty objects", () => {
            const result = root({}, {
                className: ""
            });
            expect(result).to.eql({className: ""});
        });

        it("should merge data attributes", () => {
            const result = root({
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

        it("should merge different attributes", () => {
            const result = root({
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
    });

    describe('data-automation-id', () => {
        const DAID = "data-automation-id";
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = root({[DAID]: "foo"}, {className: "root"});
            expect(result).to.eql({[DAID]: "foo", className: "root"});
        });

        it("should maintain root data-automation-id even when component style is empty", () => {
            const result = root({}, {[DAID]: "foo", className: "root"});
            expect(result).to.eql({[DAID]: "foo", className: "root"});
        });
        it("should concatenate data-automation-ids", () => {
            const result = root({
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
            expect(() => root({}, {} as any)).to.throw(Error, 'className');
        });

        it("should concatenate classNames", () => {
            const result = root({
                className: "blah"
            }, {
                className: "root"
            });

            expect(result).to.eql({className: "root blah"});
        });
    });

    describe('style', () => {
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = root({style: {color: "green"}}, {className: "root"});

            expect(result).to.eql({style: {color: "green"}, className: "root"});
        });

        it("should maintain root style even when component style is empty", () => {
            const result = root({}, {style: {color: "red"}, className: "root"});

            expect(result).to.eql({style: {color: "red"}, className: "root"});
        });

        it("should merge props", () => {
            const result = root({
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

    describe('event handlers', () => {
        const f1 = func();
        const f2 = func();
        it("should assign componentProps to root if nothing exists on root", () => {
            const result = root({onFoo: f1}, {className: "root"});
            expect(result).to.eql({onFoo: f1, className: "root"});
        });

        it("should maintain root handlers even when component style is empty", () => {
            const result = root({}, {onFoo: f1, className: "root"});
            expect(result).to.eql({onFoo: f1, className: "root"});
        });

        it("should merge handlers", () => {
            const result = root({
                onFoo: f1
            }, {
                onFoo: f2,
                className: "root"
            });

            expect(result).to.eql({onFoo: mergeEventHandlers(f1, f2), className: "root"});
            expect(result.onFoo).to.equal(mergeEventHandlers(f1, f2)); // notice the use of .equal and *not* .eql
        });
    });
});
