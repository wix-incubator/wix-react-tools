import * as React from 'react';
import { expect } from 'test-drive-react';
import { globalId } from '../../src';

class TestClass extends React.Component<Partial<globalId.Props>> {}

const { getRootId, getLocalId } = globalId;

describe('GlobalID', () => {
    const id = 'pancake';
    const anotherId = 'muffin';
    const rootId = 'kaiser';

    describe('getRootId', () => {
        it('returns the same ID for the same parameter', () => {
            const componentInstance = new TestClass();
            expect(getRootId(componentInstance)).to.equal(getRootId(componentInstance));

            const props = { id };
            expect(getRootId(props)).to.equal(getRootId(props));
        });

        it('returns different IDs for different parameters', () => {
            const componentInstance = new TestClass();
            const differentInstance = new TestClass();
            expect(getRootId(componentInstance)).to.not.equal(getRootId(differentInstance));

            const props = { id };
            const differentProps = { id: anotherId };
            expect(getRootId(props)).to.not.equal(getRootId(differentProps));
        });

        it('throws an exception when trying to get rootId for props object without id provided', () => {
            debugger;
            expect(() => getRootId({})).to.throw();
        });

        it('resolves the id from props in case it was passed', () => {
            const componentInstance = new TestClass({id});
            expect(getRootId(componentInstance)).to.equal(id);

            const props = { id: anotherId };
            expect(getRootId(props)).to.equal(anotherId);
        });

        it('resolves the id from a component\'s private state if it was not provided in props', () => {
            expect(typeof getRootId(new TestClass())).to.equal('string');
        });
    });

    describe('getLocalId', () => {
        it('returns the same localId for the same parameters', () => {
            expect(getLocalId(rootId, id)).to.equal(getLocalId(rootId, id));
        });

        it('returns different localIds for different parameters', () => {
            expect(getLocalId(rootId, id)).to.not.equal(getLocalId(rootId, anotherId));
        });

        it('returns different localIds for same different roots', () => {
            expect(getLocalId(rootId, id)).to.not.equal(getLocalId(anotherId, id));
        })
    });
});
