import {globalId} from "../dist/src/index";

const {getRootId, getLocalId} = globalId;

describe('Global ID', () => {
    describe('getRootId', () => {
        it('throws an error when passed things other than objects', () => {
// $ExpectError Argument of type '"wrong"' is not assignable
            getRootId('wrong');

// $ExpectError Argument of type 'null' is not assignable
            getRootId(null);
        });

        it('throws an error when passed a props object without id', () => {
// $ExpectError Argument of type '{}' is not assignable to parameter of type 'Identifiable'.
            getRootId({});

// $ExpectError Argument of type 'never[]' is not assignable to parameter of type 'Identifiable'.
            getRootId([]);
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
