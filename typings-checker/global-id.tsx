import * as React from "react";
import { globalId } from "../dist/src/index";

const { getRootId, getLocalId } = globalId;

describe('Global ID', () => {
    describe('getRootId', () => {
        it('throws an error when passed a props object without id', () => {
// $ExpectError tried to get root id for a props object
            getRootId({});
        });
    });
});
