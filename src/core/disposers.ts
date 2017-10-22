export const UNCAUGHT_DISPOSER_ERROR_MESSAGE = 'uncaught disposer error';

let i = 0;

function uniqueKey(): string {
    return '$$$' + (i++);
}

export class Disposers {
    private disposers: {
        [k: string]: Function
    } = {};

    set(disposer: Function): string;
    set(key: string, disposer: Function): void;
    set(key: string | Function, disposer?: Function): string | void {
        if (typeof key === 'string') {
            disposer = disposer!;
            this.execute(key);
            this.disposers[key] = disposer;
        } else {
            disposer = key;
            key = uniqueKey();
            while (this.disposers.hasOwnProperty(key)) {
                key = uniqueKey();
            }
            this.disposers[key] = disposer;
            return key;
        }
    }

    dispose(key: string): void {
        this.execute(key);
        delete this.disposers[key];
    }

    disposeAll(): void {
        Object.keys(this.disposers)
            .forEach(k => this.execute(k));
        this.disposers = {};
    }

    private execute(key: string) {
        try {
            if (this.disposers.hasOwnProperty(key)) {
                this.disposers[key]();
            }
        } catch (e) {
            console.warn(UNCAUGHT_DISPOSER_ERROR_MESSAGE, e);
        }
    }
}
