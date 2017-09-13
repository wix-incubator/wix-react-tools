import * as React from "react";
import { globalId } from "../dist/src/index";

const { getRootId, getLocalId } = globalId;

describe('Global ID', () => {
    describe('getRootId', () => {
        it('throws an error when passed a props object without id', () => {
// $ExpectError tried to get root id for a props object
            getRootId({});
        });

        it('throws an error when passed something other than object', () => {
// $ExpectError tried to get root id for a props object
            getRootId([]);

// $ExpectError Argument of type '"wrong"' is not assignable
            getRootId('wrong');

// $ExpectError Argument of type 'null' is not assignable
            getRootId(null);
        });
    });

    describe('getLocalId', () => {
        it('throws an error when passed something other than strings', () => {
// $ExpectError Argument of type '{}' is not assignable
            getLocalId({}, 'right');

// $ExpectError Argument of type '{}' is not assignable
            getLocalId('right', {});

// $ExpectError Argument of type 'null' is not assignable
            getLocalId(null, 'right');

// $ExpectError Argument of type 'null' is not assignable
            getLocalId('right', null);
        });
    });
});
