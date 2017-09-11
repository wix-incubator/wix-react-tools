import * as React from 'react';
import { expect } from 'test-drive-react';
import { GlobalID, separator } from '../../src/react-util/global-id';

interface TestProps {
    id?: string;
}

class TestClass extends React.Component<TestProps> {}

describe('GlobalID', () => {
   describe('getRootId', () => {
        let globalId: GlobalID;

        beforeEach(() => globalId = new GlobalID('test'));

        it('resolves the id from props in case it was passed', () => {
            const id = 'pancake';
            const testClass = new TestClass({id});

            expect(globalId.getRootId(testClass)).to.equal(id);
        });

        it('resolves the id from a component\'s private state (if relevant) if it was not provided in props', () => {
            const testClass = new TestClass();

            expect(globalId.getRootId(testClass)).to.equal(0);
        });
        it('produces a new unique ID and stores it in case there was no id given in props or found in private state', () => {
            throw new Error('To be implemented');
        });
   });

   describe('getLocalId', () => {
       it('generates a new unique ID for a child element', () => {
           const globalId = new GlobalID('test');

           const id = 'schmarrn';
           const rootId = 'kaiser';

           expect(globalId.getLocalId(rootId, id)).to.equal(`${rootId}${separator}${id}`);
       });
   });
});
