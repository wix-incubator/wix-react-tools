export const UNCAUGHT_DISPOSER_ERROR_MESSAGE = 'uncaught disposer error';

export class Disposers {
    private disposers:{
        [k:string]:Function
    } = {};

    set(key:string, disposer:Function){
        this.activateOld(key);
        this.disposers[key] = disposer;
    }

    dispose(key:string) {
        this.activateOld(key);
        delete this.disposers[key];
    }

    private activateOld(key: string) {
        try {
            if (this.disposers.hasOwnProperty(key)) {
                this.disposers[key]();
            }
        } catch(e){
            console.warn(UNCAUGHT_DISPOSER_ERROR_MESSAGE, e);
        }
    }

    disposeAll() {
        Object.keys(this.disposers)
            .forEach(k => this.activateOld(k));
        this.disposers = {};
    }
}
