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

  addLocations(location:object) {
    this.options.locations.push(location);
  }

  clearLocations() {
    this.options.locations = [];
  }
}


class GCirclePath {

  constructor(options) {
    this.options = {
      location: null,
      weight: null,
      color: null,
      fillcolor: null,
      geodesic: null,
      radius: null,
      detail: 8
    };
    this.setOptions(options);
  }

  toString() {
    let locations = [];
    let lat = (this.options.location.location.lat * Math.PI) / 180;
    let lng = (this.options.location.location.lng * Math.PI) / 180;
    let dimension = (this.options.radius / 1000) / 6371;

    for (let i = 0; i <= 365; i+=this.options.detail) {
      let angle = i * Math.PI / 180;
      let tempLat = Math.asin(Math.sin(lat) * Math.cos(dimension) + Math.cos(lat) * Math.sin(dimension) * Math.cos(angle));
      var tempLng = ((lng + Math.atan2(Math.sin(angle) * Math.sin(dimension) * Math.cos(lat), Math.cos(dimension) - Math.sin(lat) * Math.sin(tempLat))) * 180) / Math.PI;
      tempLat = (tempLat * 180) / Math.PI;
      locations.push(new Location({lat: tempLat, lng: tempLng}));
    }
    let myPath = new GPath({
      weight: this.options.weight,
      color: this.options.color,
      fillcolor: this.options.fillcolor,
      geodesic: this.options.geodesic,
      locations: locations
    });
    return myPath.toString();
  }

  getOptions() {
    return this.options;
  }

  setOptions(options:object) {
    this.options = Object.assign(this.options, options);

    //specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF),
    // or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}.
    let validatePath = new Validator(this.options, {
      location: 'required', // suppose to be a Location object
      weight: 'integer',
      color: 'string',
      fillcolor: 'string',
      geodesic: 'boolean',
      radius: 'numeric|required', // unit of meters
      detail: 'integer|min:8|max:20'
    });

    if (validatePath.fails()) {
      console.error(`${this.constructor.name} validation failed:`, validatePath.errors);
    }
  }
}


export {GPath, GCirclePath};