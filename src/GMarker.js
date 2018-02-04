/**
 * Created by qiyuzhao on 2018-02-02.
 */
import Validator from  'validatorjs';
import {Location} from 'src/Location';

class GMarker {
  constructor (options:object) {
    this.options = {
      color: null,
      label: null,
      size: null,
      locations: []
    };
    this.options = Object.assign(this.options, options);

    let validateMarker = new Validator(this.options, {
      color: 'string',
      label: 'string',
      size: 'string|in:normal,tiny,mid,small',
      locations: 'required|array'
    });
  }


  toString():String {
    //The set of markerStyles is declared at the beginning of the markers declaration and consists of zero or more style
    // descriptors separated by the pipe character (|), followed by a set of one or more locations also separated by the
    // pipe character (|).

    return `markers=${this.options.color ? `color:${this.options.color}|` : ''}${this.options.size ? `size:${this.options.size}|` : ''}${this.options.label ? `label:${this.options.label}|` : ''}${this.options.locations.join('|')}`;
  }

}

class GChartMarker extends GMarker {
  constructor (options:object){
    super(options);
  }
}

export {GMarker, GChartMarker};