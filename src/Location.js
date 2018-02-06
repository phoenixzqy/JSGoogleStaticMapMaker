/**
 * Created by qiyuzhao on 2018-02-02.
 */
import Validator from  'validatorjs';

class Location {
  constructor(location) {
    if (typeof location === 'string') {
      this.location = location;
    } else if (typeof location === 'object') {
      let locationValidator = new Validator(location, {
        lat: "required|numeric",
        lng: "required|numeric"
      });
      if (locationValidator.fails()) {
        console.error(`${this.constructor.name} validation failed:`, locationValidator.errors);
      } else {
        this.location = location;
      }
    } else {
      console.error('Location must be in String of address, or object of {lat: numeric, lng:numeric}');
    }
  }

  toString():String {
    if(typeof this.location === 'string') {
      return this.location;
    } else {
      return `${this.location.lat.toFixed(5)},${this.location.lng.toFixed(5)}`;
    }
  }

  toArray():Array {
    return [this.location.lat, this.location.lng];
  }
}

export {Location};