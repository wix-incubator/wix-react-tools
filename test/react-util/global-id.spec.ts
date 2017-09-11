import * as React from 'react';
import { expect } from 'test-drive-react';
import { getRootId } from '../../src/react-util/global-id';

interface TestProps {
    id: string;
}

class TestClass extends React.Component<TestProps> {}

describe('GlobalID', () => {
   describe('getRootId', () => {
        it('resolves the id from props in case it was passed', () => {
            const id = 'pancake';
            const testClass = new TestClass({id});

            expect(getRootId(testClass)).to.equal(id);
        });

        it('resolves the id from a component\'s private state (if relevant) if it was not provided in props', () => {
            throw new Error('To be implemented');
        });
        it('produces a new unique ID and stores it in case there was no id given in props or found in private state', () => {
            throw new Error('To be implemented');
        });
   });

   describe('getLocalId', () => {
       it('generates a new unique ID for a child element', () => {
           throw new Error('To be implemented');
       });
   });
});
