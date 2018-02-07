/**
 * Created by qiyuzhao on 2018-02-02.
 */

import {Utility} from 'src/Utility/Utility';
import {Location} from 'src/Location';
import Validator from  'validatorjs';
import Polyline from '@mapbox/polyline';


class BasePath {
  constructor(options:object) {
    this.options = {
      weight: null,
      color: null,
      fillcolor: null,
      geodesic: null,
    };
    this.rules = {
      weight: 'integer',
      color: 'string',
      fillcolor: 'string',
      geodesic: 'boolean',
    };
  }

  getOptions() {
    return this.options;
  }

  setOptions(options:object) {
    this.options = Object.assign(this.options, options);

    //specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF),
    // or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}.
    let validatePath = new Validator(this.options, this.rules);

    if (validatePath.fails()) {
      console.error(`${this.constructor.name} validation failed:`, validatePath.errors);
    }
  }

  _calculateLatLng(originLatLng, distance, angle) {
    let lat = (originLatLng.lat * Math.PI) / 180;
    let lng = (originLatLng.lng * Math.PI) / 180;
    let d = (distance / 1000) / 6371;

    let tempLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(angle));
    let tempLng = ((lng + Math.atan2(Math.sin(angle) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(tempLat))) * 180) / Math.PI;
    tempLat = (tempLat * 180) / Math.PI;
    return {lat: tempLat, lng: tempLng};
  }
}

class GPath extends BasePath {
  constructor(options:object) {
    super(options);
    this.options = Object.assign(this.options, {locations: []});
    this.rules = Object.assign(this.rules, {locations: 'required|array'});
    this.setOptions(options);
  }

  toString() {
    let util = new Utility();
    let options = util.cleanObject(this.options);
    let params = [];

    for (var i in options) {
      switch (i) {
        case 'locations':
          let locations = [];
          options[i].forEach((l) => {
            locations.push(l.toArray());
          });
          params.push(`enc:${Polyline.encode(locations)}`);
          //params.push(options[i].join('|')); // with numeric geo location.
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

  addLocations(location:object) {
    this.options.locations.push(location);
  }

  clearLocations() {
    this.options.locations = [];
  }
}


class GCirclePath extends BasePath {

  constructor(options) {
    super(options);
    this.options = Object.assign(this.options, {
      location: null,
      radius: null,
      detail: 8
    });
    this.rules = Object.assign(this.rules, {
      location: 'required',
      radius: 'numeric|required', // unit of meters
      detail: 'integer|min:8|max:20'
    });
    this.setOptions(options);
  }

  toString() {
    let locations = [];

    for (let i = 0; i <= 365; i += this.options.detail) {
      let tempLatLng = this._calculateLatLng(this.options.location.location, this.options.radius, i * Math.PI / 180);
      locations.push(new Location({lat: tempLatLng.lat, lng: tempLatLng.lng}));
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


}

class GRectangePath extends BasePath {

  constructor(options:Object) {
    super(options);
    this.options = Object.assign(this.options, {
      location: null,
      width: null,
      height: null
    });
    this.rules = Object.assign(this.rules, {
      location: 'required',
      width: 'numeric|required', // unit of meters
      height: 'numeric|required', // unit of meters
    });
    this.setOptions(options);
  }

  toString() {
    let latlng = this.options.location.toArray();
    latlng = {
      lat: latlng[0],
      lng: latlng[1],
    };
    let distance = Math.sqrt(Math.pow(this.options.width, 2) + Math.pow(this.options.height, 2)) / 2;
    let degree = Math.atan(this.options.width / this.options.height);
    let locations = [
      new Location(this._calculateLatLng(
        latlng,
        distance,
        degree
      )),
      new Location(this._calculateLatLng(
        latlng,
        distance,
        Math.PI - degree
      )),
      new Location(this._calculateLatLng(
        latlng,
        distance,
        degree + Math.PI
      )),
      new Location(this._calculateLatLng(
        latlng,
        distance,
        -degree
      )),
      new Location(this._calculateLatLng(
        latlng,
        distance,
        degree
      ))
    ];
    console.log(locations);
    let myPath = new GPath({
      weight: this.options.weight,
      color: this.options.color,
      fillcolor: this.options.fillcolor,
      geodesic: this.options.geodesic,
      locations: locations
    });
    return myPath.toString();
  }
}

export {GPath, GCirclePath, GRectangePath};