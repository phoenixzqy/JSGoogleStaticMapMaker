/**
 * Created by qiyuzhao on 2018-02-03.
 */

class Utility {
  constructor(){};


  // remove null objects
  cleanObject(target) {
    let result;
    if(Array.isArray(target)) {
      result = [];
    } else {
      result = {};
    }
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

}

export {Utility};