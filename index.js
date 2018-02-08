import {GMarker} from 'src/GMarker';
import {GPath, GCirclePath, GRectangePath} from 'src/GPath';
import {Location} from 'src/Location';
import Validator from  'validatorjs';
import {Utility} from 'src/Utility/Utility';

class MapMaker {
  constructor(options:object, key:string, signature:string) {
    this.GSMapUrl = 'https://maps.googleapis.com/maps/api/staticmap?';
    this.options = {
      center: null,
      zoom: null,
      size: {
        width: null,
        height: null
      },
      scale: null,
      format: null,
      maptype: null,
      language: null,
      region: null,
      paths: [],
      visible: [],
      style: null, // TODO
      markers: []
    };
    this.auth = {
      key: key,
      signature: signature
    };
    // validate key and  signature
    let validateKeyAndSignature = new Validator(this.auth, {
      key: 'required|string',
      signature: 'string'
    });
    if (validateKeyAndSignature.fails())
      console.error(`${this.constructor.name} validation failed:`, validateKeyAndSignature.errors);

    this.setOptions(options);
  }

  toString():String {
    let util = new Utility();
    let options = util.cleanObject(this.options);
    let auth = util.cleanObject(this.auth);
    let params = [];
    // options
    for (var i in options) {
      switch (i) {
        case 'center':
          params.push(`${i}=` + options[i].toString());
          break;
        case 'size':
          params.push(`${i}=${options.size.width}x${options.size.height}`);
          break;
        case 'paths':
          for (var p in options.paths) {
            params.push(options.paths[p].toString());
          }
          break;
        case 'markers':
          for (var m in options.markers) {
            params.push(options.markers[m].toString());
          }
          break;
        case 'visible':
          if (options.visible.length > 0)
            params.push(`${i}=${options.visible.join('|')}`)
          break;
        default:
          params.push(`${i}=${options[i]}`)
      }
    }
    // auth
    for (var i in auth) {
      params.push(`${i}=${auth[i]}`)
    }
    return encodeURI(`${this.GSMapUrl}${params.join('&')}`);
  }

  getOptions() {
    return this.options;
  }

  setOptions(options) {
    this.options = Object.assign(this.options, options);


    // validate options
    let validateOptions = new Validator(this.options, {
      center: 'required_without:markers',
      zoom: 'required_without:markers|min:0|max:21|integer',
      size: {
        width: 'required|integer',
        height: 'required|integer'
      },
      scale: 'integer|in:1,2,4',
      format: 'string|in:png8,png,png32,gif,jpg,jpg-baseline',
      maptype: 'string|in:roadmap,satellite,hybrid,terrain',
      language: 'string', // google locale codes: https://developers.google.com/maps/faq#languagesupport
      region: 'string', // Unicode region subtag identifiers: //
      // http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
      paths: 'array',
      visible: 'array',
      //style: null, // TODO
      markers: 'required_without:center|array'
    });

    if (validateOptions.fails()) {
      console.error(`${this.constructor.name} validation failed:`, validateOptions.errors);
    }
  }

  addGMarker(marker) {
    this.options.markers.push(marker);
  }

  clearGMarker() {
    this.options.markers = [];
  }

  addGPath(path) {
    this.options.paths.push(path);
  }

  clearGPath() {
    this.options.paths = [];
  }
}


export {MapMaker, GMarker, Location, GPath, GCirclePath, GRectangePath};