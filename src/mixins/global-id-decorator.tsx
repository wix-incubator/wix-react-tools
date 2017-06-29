import * as React from 'react';

let names: { [key: string]: number } = {};

export function reset() {
    names = {};
}


export function applyMixin(target: any) {
    const origRender = target.render;
    target.render = function () {
        const origCreate = React.createElement;

        (React as any).createElement = function (type: any, props: any, children: any[]) {
            if (props['htmlFor']) {
                if (!target._id || props['htmlFor'].indexOf(target._id) !== 0)  {
                    props['htmlFor'] = target.getGlobalID(props['htmlFor']);
                }
            }
            if (props['id']) {
                if (!target._id || props['id'].indexOf(target._id) !== 0) {
                    props['id'] = target.getGlobalID(props['id']);
                }
            }

            return origCreate.apply(this, arguments);
        }

        const res = origRender.apply(this, arguments);
        (React as any).createElement = origCreate;
        return res;
    }
}

export function GlobalID() {
    function generateID(name: string): string {
        if (!(names[name])) {
            names[name] = 1;
        } else {
            names[name]++;
        }

        return name + names[name];
    };

    return function (cls: any) {
        cls.prototype.getGlobalID = function (str: string) {
            if (this.props.id) {
                this._id = this.props.id;
            } else {
                if (!this._id) { this._id = generateID(this.constructor.name); }
            }
            return this._id + (str == 'ROOT' ? '' : '_' + str);
        }
        return cls;
    }
}



