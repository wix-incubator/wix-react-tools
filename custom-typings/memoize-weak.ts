
declare module "memoize-weak" {
    function memoize<T extends Function>(fn:T): T;
    export = memoize;
}
