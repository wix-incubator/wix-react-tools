import * as React from 'react';
import { expect } from 'test-drive-react';
import { getLocalId, getRootId, separator } from '../../src/react-util/global-id';

interface TestProps {
    id?: string;
}

class TestClass extends React.Component<TestProps> {}

describe('GlobalID', () => {
   describe('getRootId', () => {
       const id = 'pancake';

        it('resolves the id from props in case it was passed', () => {
            const testClass = new TestClass({id});

            expect(getRootId(testClass)).to.equal(id);
        });

        it('resolves the id from a component\'s private state (if relevant) if it was not provided in props', () => {
            const firstInstance = new TestClass();
            expect(getRootId(firstInstance)).to.equal('0');

            const providedIdInstance = new TestClass({id});
            expect(getRootId(providedIdInstance)).to.equal(id);
            expect(getRootId(firstInstance)).to.equal('0');
        });

        it('produces a new unique ID and stores it in case there was no id given in props or found in private state', () => {
            const secondInstance = new TestClass();
            expect(getRootId(secondInstance)).to.equal('1');

            const incrementedIdInstance = new TestClass();
            expect(getRootId(incrementedIdInstance)).to.equal('2');
            expect(getRootId(secondInstance)).to.equal('1');
        });
   });

   describe('getLocalId', () => {
       it('generates a new unique ID for a child element', () => {
           const id = 'schmarrn';
           const rootId = 'kaiser';

           expect(getLocalId(rootId, id)).to.equal(`${rootId}${separator}${id}`);
       });
   });
});
