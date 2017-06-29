export const UNCAUGHT_DISPOSER_ERROR_MESSAGE = 'uncaught disposer error';

export class Disposers {
    private disposers:{
        [k:string]:Function
    } = {};

    set(key:string, disposer:Function):void{
        this.execute(key);
        this.disposers[key] = disposer;
    }

    dispose(key:string):void {
        this.execute(key);
        delete this.disposers[key];
    }

    private execute(key: string) {
        try {
            if (this.disposers.hasOwnProperty(key)) {
                this.disposers[key]();
            }
        } catch(e){
            console.warn(UNCAUGHT_DISPOSER_ERROR_MESSAGE, e);
        }
    }

    disposeAll():void {
        Object.keys(this.disposers)
            .forEach(k => this.execute(k));
        this.disposers = {};
    }
}
