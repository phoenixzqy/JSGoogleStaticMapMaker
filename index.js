import {Marker, GChartMarker} from 'src/Marker';
import 'validatorjs';

class GStaticMapMaker {
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
    this.key = key;
    this.signature = signature;

    let validator = new Validator();
    // validate options
    validator.validate(options, {
      center: 'required_without:markers|string',
      zoom: 'required_without:markers|min:0|max:21|number',
      size: {
        width: 'required|number',
        height: 'required|number'
      },
      scale: 'number|in:1,2',
      format: 'string|in:JPEG,GIF,PNG',
      maptype: 'string|in:roadmap,satellite,hybrid,terrain',
      language: 'string', // google locale codes: https://developers.google.com/maps/faq#languagesupport
      region: 'type:string', // Unicode region subtag identifiers: //
      // http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
      path: 'array',
      visible: 'array',
      style: null, // TODO
      markers: 'required_without:center|array'
    });
    // validate key and  signature
    validator.validate({
      key: this.key,
      signature: this.signature
    }, {
      key: 'required|type:string',
      signature: 'string'
    });

  }
}
