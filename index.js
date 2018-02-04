import {GMarker, GChartMarker} from 'src/GMarker';
import {Location} from 'src/Location';
import Validator from  'validatorjs';


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
      path: [],
      visible: null,
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
      console.error('validation fails:', validateKeyAndSignature.errors);

    this.setOptions(options);
  }

  toString():String {
    let options = this.cleanObject(this.options);
    let auth = this.cleanObject(this.auth);
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
        case 'path':
          // TODO:
          break;
        case 'markers':
          for (var m in options.markers) {
            params.push(options.markers[m].toString())
          }
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

  // remove null objects
  cleanObject(target) {
    var result = {};
    for (var i in target) {
      if (target[i] === null || typeof target[i] === 'undefined') {
        continue;
      } if (Array.isArray(target[i])) {
        result[i] = this.cleanObject(target[i]);
      } else {
        result[i] = target[i];
      }
    }
    return result;
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
      scale: 'integer|in:1,2',
      format: 'string|in:JPEG,GIF,PNG',
      maptype: 'string|in:roadmap,satellite,hybrid,terrain',
      language: 'string', // google locale codes: https://developers.google.com/maps/faq#languagesupport
      region: 'type:string', // Unicode region subtag identifiers: //
      // http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
      path: 'array',
      visible: 'array',
      //style: null, // TODO
      markers: 'required_without:center|array'
    });

    if (validateOptions.fails()) {
      console.error('validation fails:', validateOptions.errors);
    }
  }
}


export {MapMaker, GMarker, Location};