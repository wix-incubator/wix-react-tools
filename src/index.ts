// business logic
export {root} from './core/root-handler';
export * from './core/merge-events';
export * from './core/types';
export * from './core/config';
export * from './core/private-context';
export * from "./function-decor";

// legacy :
//bases
export * from './old/bases/observable-component';
//mixins
export * from './old/mixins/disposable-decorator';
export * from './old/mixins/global-id-decorator';
//utils
export * from './old/utils/class-decor/index';
export * from './old/utils/react-decor';
export * from './old/utils/disposers';
// custom exports:
import {after as CDAfter, before as CDBefore, middleware as CDMiddleware} from "./old/utils/class-decor/index";
import {middleware as FDMiddleware} from "./function-decor";


//TODO: merge types of class decor and function decor
export const before: typeof CDBefore = CDBefore;
export const after: typeof CDAfter = CDAfter;


export const middleware = function middlewareRoot() {
    if (arguments.length > 1) {
        return CDMiddleware.apply(null, arguments);
    } else {
        return FDMiddleware.apply(null, arguments);
    }
} as any as ((typeof CDMiddleware) & (typeof FDMiddleware));
Object.setPrototypeOf(middleware, CDMiddleware);
