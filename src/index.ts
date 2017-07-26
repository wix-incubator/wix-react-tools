// business logic
export {root} from './core/root-handler';
export * from './core/merge-events';
export * from './core/types';
export * from './core/config';
export * from './core/private-context';


// legacy :
//bases
export * from './old/bases/observable-component';
//mixins
export * from './old/mixins/disposable-decorator';
export * from './old/mixins/global-id-decorator';
//utils
export * from './old/utils/class-decor/';
export * from './old/utils/react-decor';
export * from './old/utils/disposers';
// custom exports:
import {after as CDAfter, before as CDBefore, middleware as CDMiddleware} from "./old/utils/class-decor/";


//TODO: merge types of class decor and function decor
export const before: typeof CDBefore = CDBefore;
export const after: typeof CDAfter = CDAfter;
export const middleware: typeof CDMiddleware = CDMiddleware;
