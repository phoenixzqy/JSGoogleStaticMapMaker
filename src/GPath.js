/**
 * Created by qiyuzhao on 2018-02-02.
 */

import {Utility} from 'src/Utility/Utility';
import {Location} from 'src/Location';
import Validator from  'validatorjs';


class GPath {
    constructor(options:object) {
        this.options = {
            weight: null,
            color: null,
            fillcolor: null,
            geodesic: null,
            locations: []
        };
        this.setOptions(options);
    }

    toString() {
        let util = new Utility();
        let options = util.cleanObject(this.options);
        let params = [];

        for (var i in options) {
            switch (i) {
                case 'locations':
                    params.push(options[i].join('|'));
                    break;
                case 'geodesic':
                    if (this.options.geodesic === true) {
                        params.push(`${i}:true`);
                    } else if (this.options.geodesic === false) {
                        params.push(`${i}:false`);
                    }
                    break;
                default:
                    params.push(`${i}:${options[i].toString()}`);
            }
        }
        return `path=${params.join('|')}`;
    }

    getOptions() {
        return this.options;
    }

    setOptions(options:object) {
        this.options = Object.assign(this.options, options);

        //specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF),
        // or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}.
        let validatePath = new Validator(this.options, {
            weight: 'integer',
            color: 'string',
            fillcolor: 'string',
            geodesic: 'boolean',
            locations: 'required|array'
        });

        if (validatePath.fails()) {
            console.error(`${this.constructor.name} validation failed:`, validatePath.errors);
        }
    }
}

export {GPath};