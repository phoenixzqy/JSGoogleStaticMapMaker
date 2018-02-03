/**
 * Created by qiyuzhao on 2018-02-02.
 */

class Marker {
  constructor (options:object) {
    this.options = {
      latlng : {
        lat: null,
        lng: null
      },
      color: null,
      label: null,
      size: ['normal','tiny', 'mid', 'small'].includes(options.size) ? options.size : 'normal'
    };
    this.options = Object.Assign(this.options, options);
    this.options.size = ['normal','tiny', 'mid', 'small'].includes(this.options.size) ? this.options.size : 'normal';
  }

  print():String {
    //TODO
  }

}

class GChartMarker extends Marker {
  constructor (options:object){
    super(options);
  }
}

export {Marker, GChartMarker};