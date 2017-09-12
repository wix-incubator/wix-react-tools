import * as React from 'react';
import { expect } from 'test-drive-react';
import { getLocalId, getRootId, GlobalIDTarget } from '../../src';

class TestClass extends React.Component<GlobalIDTarget> {}

describe('GlobalID', () => {
    const id = 'pancake';
    const anotherId = 'muffin';
    const rootId = 'kaiser';

    describe('getRootId', () => {
        it('returns the same ID for the same parameter', () => {
            const componentInstance = new TestClass();
            expect(getRootId(componentInstance)).to.equal(getRootId(componentInstance));

            const props = {};
            expect(getRootId(props)).to.equal(getRootId(props));
        });

        it('returns different IDs for different parameters', () => {
            const componentInstance = new TestClass();
            const differentInstance = new TestClass();
            expect(getRootId(componentInstance)).to.not.equal(getRootId(differentInstance));

            const props = { id: 'props'};
            const differentProps = { id: 'differentProps'};
            expect(getRootId(props)).to.not.equal(getRootId(differentProps));
        });

       it('resolves the id from props in case it was passed', () => {
           const componentInstance = new TestClass({id});
           expect(getRootId(componentInstance)).to.equal(id);

           const props = { id: anotherId };
           expect(getRootId(props)).to.equal(anotherId);
       });

        it('resolves the id from a component\'s private state (if relevant) if it was not provided in props', () => {
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
    });
});
