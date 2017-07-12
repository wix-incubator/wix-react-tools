
declare module "react/lib/ReactCurrentOwner" {

    const ReactCurrentOwner : {
        current: null | {
            _instance:any
        }
    };

    export = ReactCurrentOwner;
}
