
declare module "memoize-weak" {
    function memoize<T extends Function>(fn:T): T & {
        /**
         * clear the cache
         */
        clear():void
    };
    export = memoize;
}
