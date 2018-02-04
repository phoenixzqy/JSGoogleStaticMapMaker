/**
 * Created by qiyuzhao on 2018-02-02.
 */
import Validator from  'validatorjs';
import {Location} from 'src/Location';
import {Utility} from 'src/Utility/Utility';

class GMarker {
  constructor(options:object) {
    this.options = {
      icon: null, // Icons may be up to 4096 pixels maximum size (64x64 for square images).
      anchor: null,
      color: null,
      label: null,
      size: null, // size won't work with custom icon
      locations: []
    };
    this.setOptions(options);
  }


  toString():String {
    //The set of markerStyles is declared at the beginning of the markers declaration and consists of zero or more style
    // descriptors separated by the pipe character (|), followed by a set of one or more locations also separated by the
    // pipe character (|).

    let util = new Utility();
    let options = util.cleanObject(this.options);
    let params = [];
    for (var i in options) {
      switch (i) {
        case 'locations':
          params.push(options[i].join('|'));
          break;
        case 'icon':
          params.push(`${i}:${encodeURI(options[i].toString())}`);
          break;
        default:
          params.push(`${i}:${options[i].toString()}`);
      }
    }
    return `markers=${params.join('|')}`;
  }

  getOptions() {
    return this.options;
  }

  setOptions(options:object) {
    this.options = Object.assign(this.options, options);

    let validateMarker = new Validator(this.options, {
      icon: 'string|required_with:anchor',
      anchor: 'string|in:top,bottom,left,right,center,topleft,topright,bottomleft,bottomright',
      color: 'string',
      label: 'string',
      size: 'string|in:normal,tiny,mid,small',
      locations: 'required|array',
    });

    if (validateMarker.fails()) {
      console.error(`${this.constructor.name} validation failed:`, validateMarker.errors);
    }
  }
}

export {GMarker};