var GSMMaker =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 22);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var Rules = __webpack_require__(24);
var Lang = __webpack_require__(25);
var Errors = __webpack_require__(28);
var Attributes = __webpack_require__(4);
var AsyncResolvers = __webpack_require__(29);

var Validator = function (input, rules, customMessages) {
  var lang = Validator.getDefaultLang();
  this.input = input || {};

  this.messages = Lang._make(lang);
  this.messages._setCustom(customMessages);
  this.setAttributeFormatter(Validator.prototype.attributeFormatter);

  this.errors = new Errors();
  this.errorCount = 0;

  this.hasAsync = false;
  this.rules = this._parseRules(rules);
};

Validator.prototype = {

  constructor: Validator,

  /**
   * Default language
   *
   * @type {string}
   */
  lang: 'en',

  /**
   * Numeric based rules
   *
   * @type {array}
   */
  numericRules: ['integer', 'numeric'],

  /**
   * Attribute formatter.
   *
   * @type {function}
   */
  attributeFormatter: Attributes.formatter,

  /**
   * Run validator
   *
   * @return {boolean} Whether it passes; true = passes, false = fails
   */
  check: function () {
    var self = this;

    for (var attribute in this.rules) {
      var attributeRules = this.rules[attribute];
      var inputValue = this._objectPath(this.input, attribute);

      if (this._hasRule(attribute, ['sometimes']) && !this._suppliedWithData(attribute)) {
        continue;
      }

      for (var i = 0, len = attributeRules.length, rule, ruleOptions, rulePassed; i < len; i++) {
        ruleOptions = attributeRules[i];
        rule = this.getRule(ruleOptions.name);

        if (!this._isValidatable(rule, inputValue)) {
          continue;
        }

        rulePassed = rule.validate(inputValue, ruleOptions.value, attribute);
        if (!rulePassed) {
          this._addFailure(rule);
        }

        if (this._shouldStopValidating(attribute, rulePassed)) {
          break;
        }
      }
    }

    return this.errorCount === 0;
  },

  /**
   * Run async validator
   *
   * @param {function} passes
   * @param {function} fails
   * @return {void}
   */
  checkAsync: function (passes, fails) {
    var _this = this;
    passes = passes || function () {};
    fails = fails || function () {};

    var failsOne = function (rule, message) {
      _this._addFailure(rule, message);
    };

    var resolvedAll = function (allPassed) {
      if (allPassed) {
        passes();
      } else {
        fails();
      }
    };

    var asyncResolvers = new AsyncResolvers(failsOne, resolvedAll);

    var validateRule = function (inputValue, ruleOptions, attribute, rule) {
      return function () {
        var resolverIndex = asyncResolvers.add(rule);
        rule.validate(inputValue, ruleOptions.value, attribute, function () {
          asyncResolvers.resolve(resolverIndex);
        });
      };
    };

    for (var attribute in this.rules) {
      var attributeRules = this.rules[attribute];
      var inputValue = this._objectPath(this.input, attribute);

      if (this._hasRule(attribute, ['sometimes']) && !this._suppliedWithData(attribute)) {
        continue;
      }

      for (var i = 0, len = attributeRules.length, rule, ruleOptions; i < len; i++) {
        ruleOptions = attributeRules[i];

        rule = this.getRule(ruleOptions.name);

        if (!this._isValidatable(rule, inputValue)) {
          continue;
        }

        validateRule(inputValue, ruleOptions, attribute, rule)();
      }
    }

    asyncResolvers.enableFiring();
    asyncResolvers.fire();
  },

  /**
   * Add failure and error message for given rule
   *
   * @param {Rule} rule
   */
  _addFailure: function (rule) {
    var msg = this.messages.render(rule);
    this.errors.add(rule.attribute, msg);
    this.errorCount++;
  },

  /**
   * Flatten nested object, normalizing { foo: { bar: 1 } } into: { 'foo.bar': 1 }
   *
   * @param  {object} nested object
   * @return {object} flattened object
   */
  _flattenObject: function (obj) {
    var flattened = {};

    function recurse(current, property) {
      if (!property && Object.getOwnPropertyNames(current).length === 0) {
        return;
      }
      if (Object(current) !== current || Array.isArray(current)) {
        flattened[property] = current;
      } else {
        var isEmpty = true;
        for (var p in current) {
          isEmpty = false;
          recurse(current[p], property ? property + "." + p : p);
        }
        if (isEmpty) {
          flattened[property] = {};
        }
      }
    }
    if (obj) {
      recurse(obj);
    }
    return flattened;
  },

  /**
   * Extract value from nested object using string path with dot notation
   *
   * @param  {object} object to search in
   * @param  {string} path inside object
   * @return {any|void} value under the path
   */
  _objectPath: function (obj, path) {
    if (Object.prototype.hasOwnProperty.call(obj, path)) {
      return obj[path];
    }

    var keys = path.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "").split(".");
    var copy = {};
    for (var attr in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr)) {
        copy[attr] = obj[attr];
      }
    }

    for (var i = 0, l = keys.length; i < l; i++) {
      if (Object.hasOwnProperty.call(copy, keys[i])) {
        copy = copy[keys[i]];
      } else {
        return;
      }
    }
    return copy;
  },

  /**
   * Parse rules, normalizing format into: { attribute: [{ name: 'age', value: 3 }] }
   *
   * @param  {object} rules
   * @return {object}
   */
  _parseRules: function (rules) {

    var parsedRules = {};
    rules = this._flattenObject(rules);

    for (var attribute in rules) {

      var rulesArray = rules[attribute];

      this._parseRulesCheck(attribute, rulesArray, parsedRules);
    }
    return parsedRules;


  },

  _parseRulesCheck: function (attribute, rulesArray, parsedRules, wildCardValues) {
    if (attribute.indexOf('*') > -1) {
      this._parsedRulesRecurse(attribute, rulesArray, parsedRules, wildCardValues);
    } else {
      this._parseRulesDefault(attribute, rulesArray, parsedRules, wildCardValues);
    }
  },

  _parsedRulesRecurse: function (attribute, rulesArray, parsedRules, wildCardValues) {
    var parentPath = attribute.substr(0, attribute.indexOf('*') - 1);
    var propertyValue = this._objectPath(this.input, parentPath);

    if (propertyValue) {
      for (var propertyNumber = 0; propertyNumber < propertyValue.length; propertyNumber++) {
        var workingValues = wildCardValues ? wildCardValues.slice() : [];
        workingValues.push(propertyNumber);
        this._parseRulesCheck(attribute.replace('*', propertyNumber), rulesArray, parsedRules, workingValues);
      }
    }
  },

  _parseRulesDefault: function (attribute, rulesArray, parsedRules, wildCardValues) {
    var attributeRules = [];

    if (rulesArray instanceof Array) {
      rulesArray = this._prepareRulesArray(rulesArray);
    }

    if (typeof rulesArray === 'string') {
      rulesArray = rulesArray.split('|');
    }

    for (var i = 0, len = rulesArray.length, rule; i < len; i++) {
      rule = typeof rulesArray[i] === 'string' ? this._extractRuleAndRuleValue(rulesArray[i]) : rulesArray[i];
      if (rule.value) {
        rule.value = this._replaceWildCards(rule.value, wildCardValues);
        this._replaceWildCardsMessages(wildCardValues);
      }

      if (Rules.isAsync(rule.name)) {
        this.hasAsync = true;
      }
      attributeRules.push(rule);
    }

    parsedRules[attribute] = attributeRules;
  },

  _replaceWildCards: function (path, nums) {

    if (!nums) {
      return path;
    }

    var path2 = path;
    nums.forEach(function (value) {
      var pos = path2.indexOf('*');
      if (pos === -1) {
        return path2;
      }
      path2 = path2.substr(0, pos) + value + path2.substr(pos + 1);
    });
    return path2;
  },

  _replaceWildCardsMessages: function (nums) {
    var customMessages = this.messages.customMessages;
    var self = this;
    Object.keys(customMessages).forEach(function (key) {
      if (nums) {
        var newKey = self._replaceWildCards(key, nums);
        customMessages[newKey] = customMessages[key];
      }
    });

    this.messages._setCustom(customMessages);
  },
  /**
   * Prepare rules if it comes in Array. Check for objects. Need for type validation.
   *
   * @param  {array} rulesArray
   * @return {array}
   */
  _prepareRulesArray: function (rulesArray) {
    var rules = [];

    for (var i = 0, len = rulesArray.length; i < len; i++) {
      if (typeof rulesArray[i] === 'object') {
        for (var rule in rulesArray[i]) {
          rules.push({
            name: rule,
            value: rulesArray[i][rule]
          });
        }
      } else {
        rules.push(rulesArray[i]);
      }
    }

    return rules;
  },

  /**
   * Determines if the attribute is supplied with the original data object.
   *
   * @param  {array} attribute
   * @return {boolean}
   */
  _suppliedWithData: function (attribute) {
    return this.input.hasOwnProperty(attribute);
  },

  /**
   * Extract a rule and a value from a ruleString (i.e. min:3), rule = min, value = 3
   *
   * @param  {string} ruleString min:3
   * @return {object} object containing the name of the rule and value
   */
  _extractRuleAndRuleValue: function (ruleString) {
    var rule = {},
      ruleArray;

    rule.name = ruleString;

    if (ruleString.indexOf(':') >= 0) {
      ruleArray = ruleString.split(':');
      rule.name = ruleArray[0];
      rule.value = ruleArray.slice(1).join(":");
    }

    return rule;
  },

  /**
   * Determine if attribute has any of the given rules
   *
   * @param  {string}  attribute
   * @param  {array}   findRules
   * @return {boolean}
   */
  _hasRule: function (attribute, findRules) {
    var rules = this.rules[attribute] || [];
    for (var i = 0, len = rules.length; i < len; i++) {
      if (findRules.indexOf(rules[i].name) > -1) {
        return true;
      }
    }
    return false;
  },

  /**
   * Determine if attribute has any numeric-based rules.
   *
   * @param  {string}  attribute
   * @return {Boolean}
   */
  _hasNumericRule: function (attribute) {
    return this._hasRule(attribute, this.numericRules);
  },

  /**
   * Determine if rule is validatable
   *
   * @param  {Rule}   rule
   * @param  {mixed}  value
   * @return {boolean}
   */
  _isValidatable: function (rule, value) {
    if (Rules.isImplicit(rule.name)) {
      return true;
    }

    return this.getRule('required').validate(value);
  },

  /**
   * Determine if we should stop validating.
   *
   * @param  {string} attribute
   * @param  {boolean} rulePassed
   * @return {boolean}
   */
  _shouldStopValidating: function (attribute, rulePassed) {

    var stopOnAttributes = this.stopOnAttributes;
    if (typeof stopOnAttributes === 'undefined' || stopOnAttributes === false || rulePassed === true) {
      return false;
    }

    if (stopOnAttributes instanceof Array) {
      return stopOnAttributes.indexOf(attribute) > -1;
    }

    return true;
  },

  /**
   * Set custom attribute names.
   *
   * @param {object} attributes
   * @return {void}
   */
  setAttributeNames: function (attributes) {
    this.messages._setAttributeNames(attributes);
  },

  /**
   * Set the attribute formatter.
   *
   * @param {fuction} func
   * @return {void}
   */
  setAttributeFormatter: function (func) {
    this.messages._setAttributeFormatter(func);
  },

  /**
   * Get validation rule
   *
   * @param  {string} name
   * @return {Rule}
   */
  getRule: function (name) {
    return Rules.make(name, this);
  },

  /**
   * Stop on first error.
   *
   * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
   * @return {void}
   */
  stopOnError: function (attributes) {
    this.stopOnAttributes = attributes;
  },

  /**
   * Determine if validation passes
   *
   * @param {function} passes
   * @return {boolean|undefined}
   */
  passes: function (passes) {
    var async = this._checkAsync('passes', passes);
    if (async) {
      return this.checkAsync(passes);
    }
    return this.check();
  },

  /**
   * Determine if validation fails
   *
   * @param {function} fails
   * @return {boolean|undefined}
   */
  fails: function (fails) {
    var async = this._checkAsync('fails', fails);
    if (async) {
      return this.checkAsync(function () {}, fails);
    }
    return !this.check();
  },

  /**
   * Check if validation should be called asynchronously
   *
   * @param  {string}   funcName Name of the caller
   * @param  {function} callback
   * @return {boolean}
   */
  _checkAsync: function (funcName, callback) {
    var hasCallback = typeof callback === 'function';
    if (this.hasAsync && !hasCallback) {
      throw funcName + ' expects a callback when async rules are being tested.';
    }

    return this.hasAsync || hasCallback;
  }

};

/**
 * Set messages for language
 *
 * @param {string} lang
 * @param {object} messages
 * @return {this}
 */
Validator.setMessages = function (lang, messages) {
  Lang._set(lang, messages);
  return this;
};

/**
 * Get messages for given language
 *
 * @param  {string} lang
 * @return {Messages}
 */
Validator.getMessages = function (lang) {
  return Lang._get(lang);
};

/**
 * Set default language to use
 *
 * @param {string} lang
 * @return {void}
 */
Validator.useLang = function (lang) {
  this.prototype.lang = lang;
};

/**
 * Get default language
 *
 * @return {string}
 */
Validator.getDefaultLang = function () {
  return this.prototype.lang;
};

/**
 * Set the attribute formatter.
 *
 * @param {fuction} func
 * @return {void}
 */
Validator.setAttributeFormatter = function (func) {
  this.prototype.attributeFormatter = func;
};

/**
 * Stop on first error.
 *
 * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
 * @return {void}
 */
Validator.stopOnError = function (attributes) {
  this.prototype.stopOnAttributes = attributes;
};

/**
 * Register custom validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.register = function (name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.register(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

/**
 * Register custom validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerImplicit = function (name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.registerImplicit(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

/**
 * Register asynchronous validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerAsync = function (name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.registerAsync(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

/**
 * Register asynchronous validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerAsyncImplicit = function (name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.registerAsyncImplicit(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

/**
 * Register validator for missed validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerMissedRuleValidator = function(fn, message) {
  Rules.registerMissedRuleValidator(fn, message);
};

module.exports = Validator;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'The :attribute must be accepted.',
  after: 'The :attribute must be after :after.',
  after_or_equal: 'The :attribute must be equal or after :after_or_equal.',
  alpha: 'The :attribute field must contain only alphabetic characters.',
  alpha_dash: 'The :attribute field may only contain alpha-numeric characters, as well as dashes and underscores.',
  alpha_num: 'The :attribute field must be alphanumeric.',
  before: 'The :attribute must be before :before.',
  before_or_equal: 'The :attribute must be equal or before :before_or_equal.',
  between: 'The :attribute field must be between :min and :max.',
  confirmed: 'The :attribute confirmation does not match.',
  email: 'The :attribute format is invalid.',
  date: 'The :attribute is not a valid date format.',
  def: 'The :attribute attribute has errors.',
  digits: 'The :attribute must be :digits digits.',
  different: 'The :attribute and :different must be different.',
  'in': 'The selected :attribute is invalid.',
  integer: 'The :attribute must be an integer.',
  min: {
    numeric: 'The :attribute must be at least :min.',
    string: 'The :attribute must be at least :min characters.'
  },
  max: {
    numeric: 'The :attribute may not be greater than :max.',
    string: 'The :attribute may not be greater than :max characters.'
  },
  not_in: 'The selected :attribute is invalid.',
  numeric: 'The :attribute must be a number.',
  present: 'The :attribute field must be present (but can be empty).',
  required: 'The :attribute field is required.',
  required_if: 'The :attribute field is required when :other is :value.',
  required_unless: 'The :attribute field is required when :other is not :value.',
  required_with: 'The :attribute field is required when :field is not empty.',
  required_with_all: 'The :attribute field is required when :fields are not empty.',
  required_without: 'The :attribute field is required when :field is empty.',
  required_without_all: 'The :attribute field is required when :fields are empty.',
  same: 'The :attribute and :same fields must match.',
  size: {
    numeric: 'The :attribute must be :size.',
    string: 'The :attribute must be :size characters.'
  },
  string: 'The :attribute must be a string.',
  url: 'The :attribute format is invalid.',
  regex: 'The :attribute format is invalid.',
  attributes: {}
};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Location = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by qiyuzhao on 2018-02-02.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _validatorjs = __webpack_require__(0);

var _validatorjs2 = _interopRequireDefault(_validatorjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Location = function () {
  function Location(location) {
    _classCallCheck(this, Location);

    if (typeof location === 'string') {
      this.location = location;
    } else if ((typeof location === 'undefined' ? 'undefined' : _typeof(location)) === 'object') {
      var locationValidator = new _validatorjs2.default(location, {
        lat: "required|numeric",
        lng: "required|numeric"
      });
      if (locationValidator.fails()) {
        console.error(this.constructor.name + ' validation failed:', locationValidator.errors);
      } else {
        this.location = location;
      }
    } else {
      console.error('Location must be in String of address, or object of {lat: numeric, lng:numeric}');
    }
  }

  _createClass(Location, [{
    key: 'toString',
    value: function toString() {
      if (typeof this.location === 'string') {
        return this.location;
      } else {
        return this.location.lat.toFixed(5) + ',' + this.location.lng.toFixed(5);
      }
    }
  }, {
    key: 'toArray',
    value: function toArray() {
      if (typeof this.location === 'string') {
        return [0, 0];
      } else {
        return [this.location.lat, this.location.lng];
      }
    }
  }]);

  return Location;
}();

exports.Location = Location;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by qiyuzhao on 2018-02-03.
 */

var Utility = function () {
  function Utility() {
    _classCallCheck(this, Utility);
  }

  _createClass(Utility, [{
    key: 'cleanObject',


    // remove null objects
    value: function cleanObject(target) {
      var result = void 0;
      if (Array.isArray(target)) {
        result = [];
      } else {
        result = {};
      }
      for (var i in target) {
        if (target[i] === null || typeof target[i] === 'undefined') {
          continue;
        }if (Array.isArray(target[i])) {
          result[i] = this.cleanObject(target[i]);
        } else {
          result[i] = target[i];
        }
      }
      return result;
    }
  }]);

  return Utility;
}();

exports.Utility = Utility;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

var replacements = {

  /**
   * Between replacement (replaces :min and :max)
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  between: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      min: parameters[0],
      max: parameters[1]
    });
  },

  /**
   * Required_if replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_if: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      other: this._getAttributeName(parameters[0]),
      value: parameters[1]
    });
  },

  /**
   * Required_unless replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_unless: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      other: this._getAttributeName(parameters[0]),
      value: parameters[1]
    });
  },

  /**
   * Required_with replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_with: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      field: this._getAttributeName(parameters[0])
    });
  },

  /**
   * Required_with_all replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_with_all: function(template, rule) {
    var parameters = rule.getParameters();
    var getAttributeName = this._getAttributeName.bind(this);
    return this._replacePlaceholders(rule, template, {
      fields: parameters.map(getAttributeName).join(', ')
    });
  },

  /**
   * Required_without replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_without: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      field: this._getAttributeName(parameters[0])
    });
  },

  /**
   * Required_without_all replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_without_all: function(template, rule) {
    var parameters = rule.getParameters();
    var getAttributeName = this._getAttributeName.bind(this);
    return this._replacePlaceholders(rule, template, {
      fields: parameters.map(getAttributeName).join(', ')
    });
  },

 /**
   * After replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  after: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      after: this._getAttributeName(parameters[0])
    });
  },

  /**
   * Before replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  before: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      before: this._getAttributeName(parameters[0])
    });
  },

  /**
   * After_or_equal replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  after_or_equal: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      after_or_equal: this._getAttributeName(parameters[0])
    });
  },

  /**
   * Before_or_equal replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  before_or_equal: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      before_or_equal: this._getAttributeName(parameters[0])
    });
  },

  /**
   * Same replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  same: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      same: this._getAttributeName(parameters[0])
    });
  },
};

function formatter(attribute) {
  return attribute.replace(/[_\[]/g, ' ').replace(/]/g, '');
}

module.exports = {
  replacements: replacements,
  formatter: formatter
};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Das :attribute Feld muss akzeptiert werden.',
  after: 'Das :attribute muss ein Datum nach dem :after sein.',
  after_or_equal: 'Das :attribute Datum muss kleiner oder gleich dem :after_or_equal sein.',
  alpha: 'Das :attribute Feld darf nur aus Buchstaben bestehen.',
  alpha_dash: 'Das :attribute Feld darf nur aus Buchstaben, Zahlen, Binde- und Unterstrichen bestehen.',
  alpha_num: 'Das :attribute Feld darf nur aus Buchstaben und Zahlen bestehen.',
  before: 'Das :attribute muss ein Datum vor dem :before sein.',
  before_or_equal: 'Das :attribute Datum muss größer oder gleich dem :before_or_equal sein.',
  between: 'Das :attribute Feld muss zwischen :min und :max liegen.',
  confirmed: 'Das :attribute Feld stimmt nicht mit der Bestätigung überein.',
  email: 'Das :attribute Format ist ungültig.',
  date: 'Das :attribute Feld muss ein gültiges Datum sein.',
  def: 'Das :attribute Feld hat Fehler.',
  digits: 'Das :attribute Feld muss :digits Stellen haben.',
  different: 'Die Felder :attribute und :different müssen sich unterscheiden.',
  'in': 'Der gewählte Wert für :attribute ist ungültig.',
  integer: 'Das :attribute Feld muss eine ganze Zahl sein.',
  min: {
    numeric: 'Das :attribute Feld muss mindestens :min sein.',
    string: 'Das :attribute Feld muss mindestens :min Zeichen lang sein.'
  },
  max: {
    numeric: 'Das :attribute Feld darf maximal :max sein.',
    string: 'Das :attribute Feld darf maximal :max Zeichen haben.'
  },
  not_in: 'Der gewählte Wert für :attribute ist ungültig.',
  numeric: 'Das :attribute Feld muss eine Zahl sein.',
  present: 'Das Feld :attribute muss vorhanden sein (kann aber leer sein).',
  required: 'Das :attribute Feld muss ausgefüllt sein.',
  required_if: 'Das :attribute Feld muss ausgefüllt sein, wenn :other :value ist.',
  same: 'Die Felder :attribute und :same müssen übereinstimmen.',
  size: {
    numeric: 'Das :attribute Feld muss gleich :size sein.',
    string: 'Das :attribute Feld muss :size Zeichen lang sein.'
  },
  string: 'Das :attribute Feld muss ein Satz sein.',
  url: 'Das Format von :attribute ist ungültig.',
  regex: 'Das :attribute Format ist ungültig.',
  attributes: {}
};


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Το πεδίο :attribute πρέπει να γίνει αποδεκτό.',
  after: 'Το πεδίο :attribute πρέπει να είναι μία ημερομηνία μετά από :after.',
  alpha: 'Το πεδίο :attribute μπορεί να περιέχει μόνο γράμματα.',
  alpha_dash: 'Το πεδίο :attribute μπορεί να περιέχει μόνο γράμματα, αριθμούς, και παύλες.',
  alpha_num: 'Το πεδίο :attribute μπορεί να περιέχει μόνο γράμματα και αριθμούς.',
  between: 'Το πεδίο :attribute πρέπει να είναι μεταξύ :min και :max.',
  confirmed: 'Η επιβεβαίωση του :attribute δεν ταιριάζει.',
  email: 'Το πεδίο :attribute πρέπει να είναι μία έγκυρη διεύθυνση email.',
  date: 'Το πεδίο :attribute δεν είναι έγκυρη ημερομηνία.',
  def: 'Το πεδίο :attribute περιέχει σφάλματα.',
  digits: 'Το πεδίο :attribute πρέπει να είναι :digits ψηφία.',
  different: 'Το πεδίο :attribute  και :different πρέπει να είναι διαφορετικά.',
  'in': 'Το επιλεγμένο :attribute δεν είναι έγκυρο.',
  integer: 'Το πεδίο :attribute πρέπει να είναι ακέραιος.',
  min: {
    numeric: 'Το πεδίο :attribute πρέπει να είναι τουλάχιστον :min.',
    string: 'Το πεδίο :attribute πρέπει να έχει τουλάχιστον :min χαρακτήρες.'
  },
  max: {
    numeric: 'Το πεδίο :attribute δεν μπορεί να είναι μεγαλύτερο από :max.',
    string: 'Το πεδίο :attribute δεν μπορεί να έχει περισσότερους από :max χαρακτήρες.'
  },
  not_in: 'Το επιλεγμένο :attribute δεν είναι αποδεκτό.',
  numeric: 'Το πεδίο :attribute πρέπει να είναι αριθμός.',
  present: 'The :attribute field must be present (but can be empty).',
  required: 'Το πεδίο :attribute είναι απαραίτητο.',
  required_if: 'Το πεδίο :attribute είναι απαραίτητο όταν το πεδίο :other είναι :value.',
  same: 'Τα πεδία :attribute και :same πρέπει να είναι ίδια.',
  size: {
    numeric: 'Το πεδίο :attribute πρέπει να είναι :size.',
    string: 'Το πεδίο :attribute πρέπει να είναι :size χαρακτήρες.'
  },
  string: 'Το πεδίο :attribute πρέπει να είναι αλφαριθμητικό.',
  url: 'Το πεδίο :attribute δεν είναι έγκυρη διεύθυνση URL.',
  regex: 'Η μορφή του :attribute δεν είναι αποδεκτή.',
  attributes: {}
};


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'El campo :attribute debe ser aceptado.',
  after: 'El campo :attribute debe ser una fecha posterior a :after.',
  alpha: 'El campo :attribute solo debe contener letras.',
  alpha_dash: 'El campo :attribute solo debe contener letras, números y guiones.',
  alpha_num: 'El campo :attribute solo debe contener letras y números.',
  attributes: {},
  between: 'El campo :attribute tiene que estar entre :min - :max.',
  confirmed: 'La confirmación de :attribute no coincide.',
  different: 'El campo :attribute y :other deben ser diferentes.',
  digits: 'El campo :attribute debe tener :digits dígitos.',
  email: 'El campo :attribute no es un correo válido.',
  'in': 'El campo :attribute es inválido.',
  integer: 'El campo :attribute debe ser un número entero.',
  max: {
    numeric: 'El campo :attribute no debe ser mayor a :max.',
    string: 'El campo :attribute no debe ser mayor que :max caracteres.'
  },
  min: {
    numeric: 'El tamaño del campo :attribute debe ser de al menos :min.',
    string: 'El campo :attribute debe contener al menos :min caracteres.'
  },
  not_in: 'El campo :attribute es inválido.',
  numeric: 'El campo :attribute debe ser numérico.',
  present: 'El campo de :attribute debe estar presente (pero puede estar vacío).',
  regex: 'El formato del campo :attribute es inválido.',
  required: 'El campo :attribute es obligatorio.',
  required_if: 'El campo :attribute es obligatorio cuando :other es :value.',
  same: 'El campo :attribute y :other deben coincidir.',
  size: {
    numeric: 'El tamaño del campo :attribute debe ser :size.',
    string: 'El campo :attribute debe contener :size caracteres.'
  },
  url: 'El formato de :attribute es inválido.'
};


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'فیلد :attribute می بایست تایید شود',
  alpha: 'فیلد :attribute می بایست فقط شامل حروف انگلیسی باشد',
  alpha_dash: 'فیلد :attribute می بایست فقط شامل حروف انگلیسی و خط تیره و زیرخط باشد',
  alpha_num: 'فیلد :attribute می بایست فقط شامل حروف و اعداد باشد',
  between: 'فیلد :attribute می بایست بزرگتر از :min و کوچکتر از :max باشد',
  confirmed: 'تطبیق فیلد :attribute صحیح نمی باشد',
  email: 'فرمت ایمیل وارد شده در :attribute صحیح نمی‌باشد',
  date: 'تاریخ درج شده در فیلد :attribute صحیح نیست',
  def: 'فیلد :attribute اشکال دارد',
  digits: 'فیلد :attribute می بایست شامل :digits رقم باشد',
  different: 'فیلد :attribute می بایست مقداری غیر از :different داشته باشد',
  'in': 'فیلد :attribute انتخاب شده صحیح نمی باشد',
  integer: 'فیلد :attribute می بایست عددی باشد',
  min: {
    numeric: 'فیلد :attribute می بایست از :min بزرگتر باشد',
    string: 'فیلد :attribute بایستی حداقل :min کاراکتر طول داشته باشد'
  },
  max: {
    numeric: 'فیلد :attribute می بایست از :max کوچکتر باشد',
    string: 'فیلد :attribute نباید بیشتر از :max کاراکتر طول داشته باشد'
  },
  not_in: 'فیلد :attribute انتخاب شده صحیح نمی باشد',
  numeric: 'فیلد :attribute می بایست عددی باشد',
  present: 'The :attribute field must be present (but can be empty).',
  required: 'فیلد :attribute الزامی است',
  required_if: 'در صورت دادن :value به :other تکمیل فیلد :attribute الزامی است',
  same: 'فیلد :attribute می بایست با فیلد :same یکی باشد',
  size: {
    numeric: 'فیلد :attribute می بایست :size باشد',
    string: 'فیلد :attribute می بایست :size کاراکتر طول داشته باشد'
  },
  string: 'فیلد :attribute می بایست متنی باشد',
  url: 'آدرس فیلد :attribute صحیح نمی باشد',
  regex: 'فرمت آدرس :attribute صحیح نمی باشد',
  attributes: {}
};


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Le champ :attribute doit être accepté.',
  alpha: 'Le champ :attribute ne peut contenir que des caractères alphabétiques.',
  alpha_dash: 'Le champ :attribute ne peut contenir que des caractères alphanumériques, des tirets et des underscores.',
  alpha_num: 'Le champ :attribute ne peut contenir que des caractères alphanumériques.',
  between: 'La longueur du champ :attribute doit être comprise entre :min and :max.',
  confirmed: 'Le champ :attribute n\'est pas confirmé.',
  email: 'Le champ :attribute contient un format invalide.',
  def: 'Le champ :attribute contient un attribut erroné.',
  digits: 'Le champ :attribute doit être composé de :digits chiffres.',
  different: 'Les champs :attribute et :different doivent être différents.',
  'in': 'Le champ :attribute est invalide.',
  integer: 'Le champ :attribute doit être un entier.',
  min: {
    numeric: 'Le champ :attribute doit être supérieur à :min.',
    string: 'Le champ :attribute doit contenir plus de :min caractères.'
  },
  max: {
    numeric: 'Le champ :attribute doit être inférieur à :max.',
    string: 'Le champ :attribute doit contenir moins de :max caractères.'
  },
  not_in: 'Le champ :attribute est invalide.',
  numeric: 'Le champ :attribute doit être un chiffre.',
  present: 'Le champ :attribute doit être présent (mais peut être vide).',
  required: 'Le champ :attribute est requis.',
  required_if: 'Le champ :attribute est requis quand :other est :value.',
  same: 'Les champs :attribute et :same doivent correspondre.',
  size: {
    numeric: 'Le champ :attribute doit être égal à :size.',
    string: 'Le champ :attribute doit contenir :size caractères.'
  },
  url: 'Le format du champ :attribute est invalide.',
  regex: 'Le format du champ :attribute est invalide.',
  attributes: {}
};


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Il campo :attribute deve essere accettato.',
  alpha: 'Il campo :attribute deve contenere sono caratteri alfabetici.',
  alpha_dash: 'Il campo :attribute può contenere solo caratteri alfanumerici oltre a trattini e trattini bassi.',
  alpha_num: 'Il campo :attribute deve essere alfanumerico.',
  between: 'Il campo :attribute deve essere compreso tra :min e :max.',
  confirmed: 'Il campo conferma :attribute non è uguale.',
  email: 'Il formato dell\'attributo :attribute non è valido.',
  def: 'Gli attributi del campo :attribute contengono degli errori.',
  digits: 'Il campo :attribute deve essere di :digits cifre.',
  different: 'Il campo :attribute e :different devo essere diversi.',
  'in': 'Il valore del campo :attribute non è valido.',
  integer: 'Il campo :attribute deve essere un valore intero.',
  min: {
    numeric: 'Il campo :attribute deve essere maggiore o uguale di :min.',
    string: 'Il campo :attribute deve essere composto da almeno :min caratteri.'
  },
  max: {
    numeric: 'Il campo :attribute deve essere minore o uguale di :max.',
    string: 'Il campo :attribute deve essere composto da massimo :max caratteri.'
  },
  not_in: 'Il campo :attribute non è valido.',
  numeric: 'Il campo :attribute deve essere un numero.',
  present: 'Il campo :attribute deve essere presente (ma può essere vuoto).',
  required: 'Il campo :attribute è richiesto.',
  required_if: 'Il campo :attribute è richiesto quando il campo :other è uguale a :value.',
  same: 'I campi :attribute e :same devono essere uguali.',
  size: {
    numeric: 'La dimensione del campo :attribute deve essere uguale a :size.',
    string: 'Il campo :attribute deve essere di :size caratteri.'
  },
  string: 'Il campo :attribute deve essere una stringa.',
  url: 'Il formato del campo :attribute non è valido.',
  regex: 'Il formato del campo :attribute non è valido.',
  attributes: {}
};


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = {
    accepted: ':attributeを確認してください。',
    alpha: ':attributeは英字のみで入力してください。',
    alpha_dash: ':attributeは英字とダッシュと下線のみで入力してください。',
    alpha_num: ':attributeは英数字のみで入力してください。',
    between: ':attributeは:min〜:max文字で入力してください。',
    confirmed: ':attributeは確認が一致しません。',
    email: ':attributeは正しいメールアドレスを入力してください。',
    date: ':attributeは正しい日付形式を入力してください',
    def: ':attributeは検証エラーが含まれています。',
    digits: ':attributeは:digitsの数字のみで入力してください。',
    different: ':attributeと:differentは同じであってはなりません。',
    'in': '選択された:attributeは無効です。',
    integer: ':attributeは整数で入力してください。',
    min        : {
        numeric : ":attributeは:min以上で入力してください。",
        string  : ":attributeは:min文字以上で入力してください。"
    },
    max : {
        numeric : ":attributeは:max以下で入力してください。",
        string  : ":attributeは:max文字以下で入力してください。"
    },
    not_in      : "選択された:attributeは無効です。",
    numeric     : ":attributeは数値で入力してください。",
    present: 'The :attribute field must be present (but can be empty).',
    required    : ":attributeは必須です。",
    required_if : ":otherは:valueになったら:attributeは必須です。",
    same        : ":attributeと:sameは同じでなければなりません。",
    size        : {
        numeric : ":attributeは:sizeを入力してください。",
        string  : ":attributeは:size文字で入力してください。"
    },
    url        : ":attributeは正しいURIを入力してください。",
    regex      : ":attributeの値 \":value\" はパターンにマッチする必要があります。",
    attributes : {}
};


/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute må være akseptert.',
  alpha: ':attribute feltet kan kun inneholde alfabetiske tegn.',
  alpha_dash: ':attribute feltet kan kun inneholde alfanumeriske tegn, i tillegg til bindestreker og understreker.',
  alpha_num: ':attribute feltet må være alfanumerisk.',
  between: ':attribute feltet må være mellom :min og :max.',
  confirmed: ':attribute feltet stemmer ikke overens med bekreftelsen.',
  email: ':attribute formatet er ugyldig.',
  date: ':attribute er et ugyldig datoformat.',
  def: ':attribute attributtet har feil.',
  digits: ':attribute må være på :digits siffer.',
  different: ':attribute og :different må være forskjellige.',
  'in': 'Den oppgitte verdien for :attribute er ugyldig.',
  integer: ':attribute må være et heltall.',
  min: {
    numeric: ':attribute må minst være :min.',
    string: ':attribute må være på minst :min tegn.'
  },
  max: {
    numeric: ':attribute kan ikke være større enn :max.',
    string: ':attribute kan maks ha :max tegn.'
  },
  'not_in': 'Den oppgitte verdien for :attribute er ugyldig.',
  numeric: ':attribute må være et tall.',
  present: 'The :attribute field must be present (but can be empty).',
  required: ':attribute feltet er påkrevd.',
  required_if: ':attribute er påkrevd når :other er :value.',
  same: ':attribute og :same må være like.',
  size: {
    numeric: ':attribute må ha størrelsen :size.',
    string: ':attribute må ha :size tegn.'
  },
  string: ':attribute må være tekst.',
  url: ':attribute formatet er ugyldig.',
  regex: ':attribute formatet er ugyldig.',
  attributes: {}
};


/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Het :attribute veld moet geaccepteerd worden.',
  after: ':attribute moet een datum na :after zijn.',
  after_or_equal: 'De :attribute datum moet op of na :after_or_equal zijn.',
  alpha: 'Het :attribute veld mag alleen maar letters bevatten.',
  alpha_dash: 'Het :attribute veld mag alleen maar letters, cijfers en (liggende) streepjes bevatten.',
  alpha_num: 'Het :attribute veld mag alleen maar letters en cijfers bevatten.',
  before: ':attribute moet vòòr :before zijn.',
  before_or_equal: ':attribute moet vòòr of op :before_or_equal zijn.',
  between: 'Het :attribute veld moet tussen :min en :max liggen.',
  confirmed: 'Het :attribute veld komt niet met de bevestiging overeen.',
  email: 'Het :attribute formaat is ongeldig.',
  date: 'Het :attribute veld moet een geldige datum zijn.',
  def: 'Het :attribute veld bevat fouten.',
  digits: 'Het :attribute veld moet :digits cijfers hebben.',
  different: 'Het :attribute en :different veld moeten verschillend zijn.',
  'in': 'De gekozen waarde voor :attribute is ongeldig.',
  integer: 'Het :attribute veld moet een geheel getal zijn.',
  min: {
    numeric: 'Het :attribute veld moet minstens :min zijn.',
    string: 'Het :attribute veld moet minstens :min karakters bevatten.'
  },
  max: {
    numeric: 'Het :attribute veld mag maximaal :max zijn.',
    string: 'Het :attribute veld mag niet meer dan :max karakters bevatten.'
  },
  not_in: 'De gekozen waarde voor :attribute is ongeldig.',
  numeric: 'Het :attribute veld moet een getal zijn.',
  present: 'Het :attribute veld moet aanwezig zijn (maar mag leeg zijn).',
  required: 'Het :attribute veld moet ingevuld zijn.',
  required_if: 'Het :attribute veld moet ingevuld zijn, wanneer :other :value is.',
  required_unless: 'Het :attribute veld moet ingevuld zijn, wanneer :other niet :value is.',
  required_with: 'Het :attribute veld moet ingevuld zijn, wanneer :field niet leeg is.',
  required_with_all: 'Het :attribute veld moet ingevuld zijn, wanneer :fields niet leeg zijn.',
  required_without: 'Het :attribute veld moet ingevuld zijn, wanneer :field leeg is.',
  required_without_all: 'Het :attribute veld moet ingevuld zijn, wanneer :fields leeg zijn.',
  same: 'De :attribute en :same velden moeten overeenkomen.',
  size: {
    numeric: 'Het :attribute veld moet :size zijn.',
    string: 'Het :attribute veld moet :size karakters bevatten.'
  },
  string: 'Het :attribute veld moet een woord of zin zijn.',
  url: 'Het :attribute veld heeft een ongeldig formaat.',
  regex: 'Het :attribute veld heeft een ongeldig formaat.',
  attributes: {}
};


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = {
    accepted: 'Pole :attribute musi być zaakceptowane.',
    alpha: 'Pole :attribute może zawierać tylko litery.',
    alpha_dash: 'Pole :attribute moze zawierać tylko litery, myślnik i podrkeślenie.',
    alpha_num: 'Pole :attribute moze zawierac tylko znaki alfanumeryczne.',
    between: 'Pole :attribute musi mieć długość od :min do :max.',
    confirmed: 'Pole :attribute nie spełnia warunku potwierdzenia.',
    email: 'Pole :attribute ma niepoprawny format adresu email.',
    date: 'Pole :attribute musi mieć poprawny format daty.',
    def: 'Pole :attribute zawiera błędy.',
    digits: 'Pole :attribute może zawierać tylko cyfry ze zbioru :digits.',
    different: 'Pola :attribute i :different muszą się różnić.',
    'in': 'Pole :attribute musi należeć do zbioru :in.',
    integer: 'Pole :attribute musi być liczbą całkowitą.',
    min: {
        numeric: 'Pole :attribute musi być równe conajmniej :min.',
        string: 'Pole :attribute musi zawierać conajmniej :min znaków.'
    },
    max: {
        numeric: 'Pole :attribute nie moze być większe :max.',
        string: 'Pole :attribute nie moze być dłuższe niż :max znaków.'
    },
    not_in: 'Pole :attribute nie może należeć do zbioru :not_in.',
    numeric: 'Pole :attribute musi być liczbą.',
    present: 'Polu :attribute musi być obecny (ale może być pusta).',
    required: 'Pole :attribute jest wymagane.',
    required_if: 'Pole :attribute jest wymagane jeśli pole :other jest równe :value.',
    same: 'Pola :attribute i :same muszą być takie same.',
    size: {
        numeric: 'Pole :attribute musi być równe :size.',
        string: 'Pole :attribute musi zawierać :size znaków.'
    },
    string: 'Pole :attribute musi być ciągiem znaków.',
    url: 'Pole :attribute musi być poprawnym adresem URL.',
    regex: 'Pole :attribute nie spełnia warunku.',
    attributes: {}
};


/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'O :attribute precisa ser aceito.',
  alpha: 'O campo :attribute só pode conter letras.',
  alpha_dash: 'O campo :attribute só pode conter letras, números, hífens e sublinha.',
  alpha_num: 'O campo :attribute só pode conter letras e números.',
  between: 'O campo :attribute precisa estar entre :min e :max.',
  confirmed: 'A confirmação de :attribute não coincide.',
  email: 'O formato de :attribute é inválido.',
  date: 'O :attribute não é um formato de data válido',
  def: 'O atributo :attribute contém erros.',
  digits: 'O atributo :attribute precisa ter :digits dígitos.',
  different: 'O :attribute e :different precisam ser diferentes.',
  'in': 'O atributo selecionado :attribute é inválido.',
  integer: 'O :attribute precisa ser um inteiro.',
  min: {
    numeric: 'O :attribute precisa ser no mínimo :min.',
    string: 'O :attribute precisa ter no mínimo :min caracteres.'
  },
  max: {
    numeric: 'O :attribute não pode ser maior que :max.',
    string: 'O :attribute não pode ter mais que :max caracteres.'
  },
  not_in: 'O :attribute selecionado é inválido.',
  numeric: 'O :attribute precisa ser um número.',
  present: 'O campo :attribute deve estar presente (mas pode estar vazio).',
  required: 'O campo :attribute é obrigatório.',
  required_if: 'O campo :attribute é obrigatório quando :other é :value.',
  same: 'Os campos :attribute e :same precisam ser iguais.',
  size: {
    numeric: 'O :attribute precisa ser :size.',
    string: 'O :attribute precisa ter :size caracteres.'
  },
  string: 'O :attribute precisa ser uma palavra.',
  url: 'O formato de :attribute é inválido.',
  regex: 'O formato de :attribute é inválido.',
  attributes: {}
};


/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = {
  accepted: 'Вы должны принять :attribute.',
  alpha: 'Поле :attribute может содержать только буквы.',
  alpha_dash: 'Поле :attribute может содержать только буквы, цифры, дефисы и символы подчёркивания.',
  alpha_num: 'Поле :attribute может содержать только буквы и цифры.',
  between: 'Поле :attribute должно быть между :min и :max.',
  confirmed: 'Поле :attribute не совпадает с подтверждением.',
  email: 'Поле :attribute должно быть действительным электронным адресом.',
  def: 'Поле :attribute содержит ошибки.',
  digits: 'Длина цифрового поля :attribute должна быть :digits.',
  different: 'Поля :attribute и :different должны различаться.',
  'in': 'Выбранное значение для :attribute ошибочно.',
  integer: 'Поле :attribute должно быть целым числом.',
  min: {
    numeric: 'Значение поля :attribute должно быть больше или равно :min.',
    string: 'Количество символов в поле :attribute должно быть не менее :min.'
  },
  max: {
    numeric: 'Значение поля :attribute должно быть меньше или равно :max.',
    string: 'Количество символов в поле :attribute не может превышать :max.'
  },
  not_in: 'Выбранное значение для :attribute ошибочно.',
  numeric: 'Поле :attribute должно быть числом.',
  present: 'Поле :attribute должно присутствовать (но может быть пустым).',
  required: 'Поле :attribute обязательно для заполнения.',
  required_if: 'Поле :attribute требуется когда значения поля :other равно :value.',
  same: 'Значение :attribute должно совпадать с :same.',
  size: {
    numeric: 'Значение поля :attribute должно быть равным :size.',
    string: 'Количество символов в поле :attribute должно быть равно :size.'
  },
  url: 'Поле :attribute должно содержать валидный URL.',
  regex: 'Неверный формат поля :attribute.',
  attributes: {}
};


/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute kabul edilmeli.',
  alpha: ':attribute alanı sadece harflerden oluşabilir.',
  alpha_dash: ':attribute alanı sadece alfa-nümerik, tire ve alt çizgi karakterlerden oluşabilir.',
  alpha_num: ':attribute alanı alfa-nümerik olmalıdır.',
  between: ':attribute alanı :min ile :max arasında olabilir.',
  confirmed: ':attribute uyuşmuyor.',
  email: ':attribute formatı geçersiz.',
  date: ':attribute geöerli bir tarih alanı değil.',
  def: ':attribute hatalar içeriyor.',
  digits: ':attribute sadece rakamlardan oluşabilir.',
  different: ':attribute ve :different farklı olmalı.',
  'in': 'Seçilen :attribute geçerli değil.',
  integer: ':attribute tam sayı olmalı.',
  min: {
    numeric: ':attribute en az :min olmalı.',
    string: ':attribute en az :min karakter uzunluğunda olmalı.'
  },
  max: {
    numeric: ':attribute en çok :max olabilir.',
    string: ':attribute uzunluğu en çok :max karakter uzunluğunda olabilir.'
  },
  not_in: 'Seçilen :attribute geçerli değil.',
  numeric: ':attribute sayı olmalı.',
  present: ':attribute alanı bulunmalıdır (ancak boş olabilir).',
  required: ':attribute alanı gerekli.',
  required_if: ':attribute alanı :other alanı :value olduğunda gerekli.',
  same: ':attribute ve :same aynı olmalı.',
  size: {
    numeric: ':attribute :size olmalı.',
    string: ':attribute :size karakter uzunluğunda olmalı.'
  },
  string: ':attribute alfa-numerik olmalı.',
  url: ':attribute formatı geçersiz.',
  regex: ':attribute formatı geçersiz.',
  attributes: {}
};


/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute повиннен бути прийнятий.',
  alpha: 'Поле :attribute може складатись тільки з літер.',
  alpha_dash: 'Поле :attribute може складатись тільки з літер, чисел, дефісів та символів підкреслення.',
  alpha_num: 'Поле :attribute може складатись тільки з літер та чисел.',
  between: 'Значення поля :attribute повинно знаходитись між :min і :max.',
  confirmed: 'Поле :attribute не співпадає з підтвердженням.',
  email: 'Значення поля :attribute повинно бути існуючою електронною адресою.',
  def: 'Поле :attribute містить помилки.',
  digits: 'Довжина числового поля :attribute повинна бути :digits.',
  different: 'Поля :attribute і :different повинні відрізнятись.',
  'in': 'Обране значення для :attribute помилкове.',
  integer: 'Значення поля :attribute повинно бути цілим числом.',
  min: {
    numeric: 'Значення поля :attribute повинно бути більшим або рівним :min.',
    string: 'Кількість символів в полі :attribute повинна бути не менше :min.'
  },
  max: {
    numeric: 'Значення поля :attribute повинно бути менше або рівне :max.',
    string: 'Кількість символів в полі :attribute не може превищувати :max.'
  },
  not_in: 'Обране значення для :attribute помилкове.',
  numeric: 'Значення поля :attribute повинно бути числом.',
  present: 'Поле :attribute повинно бути присутнім (але може бути пустим).',
  required: 'Поле :attribute обов\'язкове для заповнення.',
  required_if: 'Поле :attribute потрібне у випадку коли значення поля :other рівне :value.',
  same: 'Значеня поля :attribute повинно співпадати з :same.',
  size: {
    numeric: 'Значення поля :attribute повинно бути рівним :size.',
    string: 'Кількість символів в полі :attribute повинна бути рівною :size.'
  },
  url: 'Поле :attribute повинне містити валідний URL.',
  regex: 'Неправильний формат значення :attribute.',
  attributes: {}
};


/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute phải được chấp nhận.',
  alpha: 'Trường :attribute phải là ký tự',
  alpha_dash: ':attribute chỉ chấp nhận ký tự chữ cái, số, dấu gạch chéo và gạch dưới.',
  alpha_num: ':attribute phải là ký tự chữ cái hoặc chữ số.',
  between: ':attribute phải nằm trong khoảng :min và :max.',
  confirmed: ':attribute xác nhận không trùng khớp.',
  email: ':attribute không phải là email.',
  date: ':attribute không phải là ngày hợp lệ',
  def: 'Thuộc tính :attribute có lỗi.',
  digits: ':attribute phải là số và có chiều dài bằng :digits.',
  different: 'Giá trị của hai trường :attribute và :different phải khác nhau.',
  'in': 'Giá trị được chọn của :attribute không hợp lệ.',
  integer: ':attribute phải là số nguyên.',
  min: {
    numeric: ':attribute phải lớn hơn hoặc bằng :min.',
    string: ':attribute phải có ít nhất :min ký tự.'
  },
  max: {
    numeric: ':attribute phải nhỏ hơn hoặc bằng :max.',
    string: ':attribute phải có ít hơn :max ký tự.'
  },
  not_in: 'Giá trị được chọn của trường :attribute không hợp lệ.',
  numeric: ':attribute phải là số.',
  present: 'Trường :attribute phải có mặt (nhưng có thể để trống).',
  required: ':attribute bắt buộc nhập.',
  required_if: ':attribute là bắt buộc khi :other có giá trị :value.',
  same: 'Giá trị của :attribute và :same phải như nhau.',
  size: {
    numeric: ':attribute phải có chiều dài của bằng :size.',
    string: 'Số ký tự của :attribute phải là :size ký tự.'
  },
  string: ':attribute không phải là một chuỗi',
  url: ':attribute không phải là một Url hợp lệ.',
  regex: ':attribute không đúng định dạng',
  attributes: {}
};


/***/ }),
/* 20 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute必须是可接受的.',
  alpha: ':attribute只能包含字母.',
  alpha_dash: ':attribute只能包含字母,连字符和下划线.',
  alpha_num: ':attribute只能包含字母和数字.',
  between: ':attribute的(大小,长度等)只能在:min和:max之间.',
  confirmed: ':attribute确认不一致.',
  email: ':attribute格式不正确.',
  date: ':attribute日期格式错误.',
  def: ':attribute属性错误.',
  digits: ':attribute必须是:digits位小数.',
  different: ':attribute和:different必须不同.',
  'in': '选择的:attribute无效',
  integer: ':attribute必须是一个整数.',
  min: {
    numeric: ':attribute不能小于:min.',
    string: ':attribute长度不能小于:min.'
  },
  max: {
    numeric: ':attribute不能大于:max.',
    string: ':attribute长度不能大于:max.'
  },
  not_in: '所选的:attribute无效.',
  numeric: ':attribute必须是一个数字.',
  present: 'The :attribute field must be present (but can be empty).',
  required: ':attribute不能为空.',
  required_if: '当:other是:value时,:attribute不能为空.',
  same: ':attribute和:same必须一致.',
  size: {
    numeric: ':attribute必须等于:size.',
    string: ':attribute的长度必须等于:size.'
  },
  string: ':attribute必须是一个字符串.',
  url: ':attribute格式不正确.',
  regex: ':attribute格式不正确.',
  attributes: {}
};


/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = {
  accepted: ':attribute必須接受。',
  alpha: ':attribute只能包含字母。',
  alpha_dash: ':attribute只能包含字母，連字符和下划線。',
  alpha_num: ':attribute只能包含字母和數字。',
  between: ':attribute的值只能在:min和:max之間。',
  confirmed: ':attribute與確認輸入不一致。',
  email: ':attribute的格式錯誤。',
  date: ':attribute的日期格式錯誤。',
  def: ':attribute屬性錯誤。',
  digits: ':attribute必須是:digits位小數。',
  different: ':attribute和:different必須不同。',
  'in': '選擇的:attribute無效',
  integer: ':attribute必須是一個整數。',
  min: {
    numeric: ':attribute不能小於:min。',
    string: ':attribute的長度不能小於:min.'
  },
  max: {
    numeric: ':attribute不能大於:max。',
    string: ':attribute的長度不能大於:max.'
  },
  not_in: '所選的:attribute無效。',
  numeric: ':attribute必須是一個數字。',
  present: 'The :attribute field must be present (but can be empty).',
  required: ':attribute不能空白。',
  required_if: '當:other是:value時,:attribute不能空白。',
  same: ':attribute和:same必須一致。',
  size: {
    numeric: ':attribute必須等於:size。',
    string: ':attribute的長度必須等於:size.'
  },
  string: ':attribute必須是一個字串。',
  url: ':attribute格式不正確。',
  regex: ':attribute格式不正確。',
  attributes: {}
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GRectangePath = exports.GCirclePath = exports.GPath = exports.Location = exports.GMarker = exports.MapMaker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _GMarker = __webpack_require__(23);

var _GPath = __webpack_require__(30);

var _Location = __webpack_require__(2);

var _validatorjs = __webpack_require__(0);

var _validatorjs2 = _interopRequireDefault(_validatorjs);

var _Utility = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapMaker = function () {
  function MapMaker(options, key, signature) {
    _classCallCheck(this, MapMaker);

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
    var validateKeyAndSignature = new _validatorjs2.default(this.auth, {
      key: 'required|string',
      signature: 'string'
    });
    if (validateKeyAndSignature.fails()) console.error(this.constructor.name + ' validation failed:', validateKeyAndSignature.errors);

    this.setOptions(options);
  }

  _createClass(MapMaker, [{
    key: 'toString',
    value: function toString() {
      var util = new _Utility.Utility();
      var options = util.cleanObject(this.options);
      var auth = util.cleanObject(this.auth);
      var params = [];
      // options
      for (var i in options) {
        switch (i) {
          case 'center':
            params.push(i + '=' + options[i].toString());
            break;
          case 'size':
            params.push(i + '=' + options.size.width + 'x' + options.size.height);
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
            if (options.visible.length > 0) params.push(i + '=' + options.visible.join('|'));
            break;
          default:
            params.push(i + '=' + options[i]);
        }
      }
      // auth
      for (var i in auth) {
        params.push(i + '=' + auth[i]);
      }
      return encodeURI('' + this.GSMapUrl + params.join('&'));
    }
  }, {
    key: 'getOptions',
    value: function getOptions() {
      return this.options;
    }
  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      this.options = Object.assign(this.options, options);

      // validate options
      var validateOptions = new _validatorjs2.default(this.options, {
        center: 'required_without:markers',
        zoom: 'required_without:markers|min:0|max:21|integer',
        size: {
          width: 'required|integer',
          height: 'required|integer'
        },
        scale: 'integer|in:1,2',
        format: 'string|in:png8,png,png32,gif,jpg,jpg-baseline',
        maptype: 'string|in:roadmap,satellite,hybrid,terrain',
        language: 'string', // google locale codes: https://developers.google.com/maps/faq#languagesupport
        region: 'type:string', // Unicode region subtag identifiers: //
        // http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
        paths: 'array',
        visible: 'array',
        //style: null, // TODO
        markers: 'required_without:center|array'
      });

      if (validateOptions.fails()) {
        console.error(this.constructor.name + ' validation failed:', validateOptions.errors);
      }
    }
  }, {
    key: 'addGMarker',
    value: function addGMarker(markerOptions) {
      this.options.markers.push(new _GMarker.GMarker(markerOptions));
    }
  }, {
    key: 'clearGMarker',
    value: function clearGMarker() {
      this.options.markers = [];
    }
  }, {
    key: 'addGPath',
    value: function addGPath(pathOptions) {
      this.options.paths.push(new _GPath.GPath(pathOptions));
    }
  }, {
    key: 'clearGPath',
    value: function clearGPath() {
      this.options.paths = [];
    }
  }]);

  return MapMaker;
}();

exports.MapMaker = MapMaker;
exports.GMarker = _GMarker.GMarker;
exports.Location = _Location.Location;
exports.GPath = _GPath.GPath;
exports.GCirclePath = _GPath.GCirclePath;
exports.GRectangePath = _GPath.GRectangePath;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GMarker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by qiyuzhao on 2018-02-02.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _validatorjs = __webpack_require__(0);

var _validatorjs2 = _interopRequireDefault(_validatorjs);

var _Location = __webpack_require__(2);

var _Utility = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GMarker = function () {
  function GMarker(options) {
    _classCallCheck(this, GMarker);

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

  _createClass(GMarker, [{
    key: 'toString',
    value: function toString() {
      //The set of markerStyles is declared at the beginning of the markers declaration and consists of zero or more style
      // descriptors separated by the pipe character (|), followed by a set of one or more locations also separated by the
      // pipe character (|).

      var util = new _Utility.Utility();
      var options = util.cleanObject(this.options);
      var params = [];
      for (var i in options) {
        switch (i) {
          case 'locations':
            params.push(options[i].join('|'));
            break;
          case 'icon':
            params.push(i + ':' + encodeURI(options[i].toString()));
            break;
          default:
            params.push(i + ':' + options[i].toString());
        }
      }
      return 'markers=' + params.join('|');
    }
  }, {
    key: 'getOptions',
    value: function getOptions() {
      return this.options;
    }
  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      this.options = Object.assign(this.options, options);

      var validateMarker = new _validatorjs2.default(this.options, {
        icon: 'string|required_with:anchor',
        anchor: 'string|in:top,bottom,left,right,center,topleft,topright,bottomleft,bottomright',
        color: 'string',
        label: 'string',
        size: 'string|in:normal,tiny,mid,small',
        locations: 'required|array'
      });

      if (validateMarker.fails()) {
        console.error(this.constructor.name + ' validation failed:', validateMarker.errors);
      }
    }
  }]);

  return GMarker;
}();

exports.GMarker = GMarker;

/***/ }),
/* 24 */
/***/ (function(module, exports) {

function leapYear(year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

function isValidDate(inDate) {
    var valid = true;

    // reformat if supplied as mm.dd.yyyy (period delimiter)
    if (typeof inDate === 'string') {
      var pos = inDate.indexOf('.');
      if ((pos > 0 && pos <= 6)) {
        inDate = inDate.replace(/\./g, '-');
      }
    }

    var testDate = new Date(inDate);
    var yr = testDate.getFullYear();
    var mo = testDate.getMonth();
    var day = testDate.getDate();

    var daysInMonth = [31, (leapYear(yr) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (yr < 1000) { return false; }
    if (isNaN(mo)) { return false; }
    if (mo + 1 > 12) { return false; }
    if (isNaN(day)) { return false; }
    if (day > daysInMonth[mo]) { return false; }

    return valid;
}

var rules = {

  required: function(val) {
    var str;

    if (val === undefined || val === null) {
      return false;
    }

    str = String(val).replace(/\s/g, "");
    return str.length > 0 ? true : false;
  },

  required_if: function(val, req, attribute) {
    req = this.getParameters();
    if (this.validator._objectPath(this.validator.input, req[0]) === req[1]) {
      return this.validator.getRule('required').validate(val);
    }

    return true;
  },

  required_unless: function(val, req, attribute) {
    req = this.getParameters();
    if (this.validator._objectPath(this.validator.input, req[0]) !== req[1]) {
      return this.validator.getRule('required').validate(val);
    }

    return true;
  },

  required_with: function(val, req, attribute) {
    if (this.validator._objectPath(this.validator.input, req)) {
      return this.validator.getRule('required').validate(val);
    }

    return true;
  },

  required_with_all: function(val, req, attribute) {

    req = this.getParameters();

    for(var i = 0; i < req.length; i++) {
      if (!this.validator._objectPath(this.validator.input, req[i])) {
        return true;
      }
    }

    return this.validator.getRule('required').validate(val);
  },

  required_without: function(val, req, attribute) {

    if (this.validator._objectPath(this.validator.input, req)) {
      return true;
    }

    return this.validator.getRule('required').validate(val);
  },

  required_without_all: function(val, req, attribute) {

    req = this.getParameters();

    for(var i = 0; i < req.length; i++) {
      if (this.validator._objectPath(this.validator.input, req[i])) {
        return true;
      }
    }

    return this.validator.getRule('required').validate(val);
  },

  'boolean': function (val) {
    return (
      val === true ||
      val === false ||
      val === 0 ||
      val === 1 ||
      val === '0' ||
      val === '1' ||
      val === 'true' ||
      val === 'false'
    );
  },

  // compares the size of strings
  // with numbers, compares the value
  size: function(val, req, attribute) {
    if (val) {
      req = parseFloat(req);

      var size = this.getSize();

      return size === req;
    }

    return true;
  },

  string: function(val, req, attribute) {
    return typeof val === 'string';
  },

  sometimes: function(val) {
    return true;
  },

  /**
   * Compares the size of strings or the value of numbers if there is a truthy value
   */
  min: function(val, req, attribute) {
    var size = this.getSize();
    return size >= req;
  },

  /**
   * Compares the size of strings or the value of numbers if there is a truthy value
   */
  max: function(val, req, attribute) {
    var size = this.getSize();
    return size <= req;
  },

  between: function(val, req, attribute) {
    req = this.getParameters();
    var size = this.getSize();
    var min = parseFloat(req[0], 10);
    var max = parseFloat(req[1], 10);
    return size >= min && size <= max;
  },

  email: function(val) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(val);
  },

  numeric: function(val) {
    var num;

    num = Number(val); // tries to convert value to a number. useful if value is coming from form element

    if (typeof num === 'number' && !isNaN(num) && typeof val !== 'boolean') {
      return true;
    } else {
      return false;
    }
  },

  array: function(val) {
    return val instanceof Array;
  },

  url: function(url) {
    return (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i).test(url);
  },

  alpha: function(val) {
    return (/^[a-zA-Z]+$/).test(val);
  },

  alpha_dash: function(val) {
    return (/^[a-zA-Z0-9_\-]+$/).test(val);
  },

  alpha_num: function(val) {
    return (/^[a-zA-Z0-9]+$/).test(val);
  },

  same: function(val, req) {
    var val1 = this.validator._flattenObject(this.validator.input)[req];
    var val2 = val;

    if (val1 === val2) {
      return true;
    }

    return false;
  },

  different: function(val, req) {
    var val1 = this.validator._flattenObject(this.validator.input)[req];
    var val2 = val;

    if (val1 !== val2) {
      return true;
    }

    return false;
  },

  "in": function(val, req) {
    var list, i;

    if (val) {
      list = this.getParameters();
    }

    if (val && !(val instanceof Array)) {
      var localValue = val;

      for (i = 0; i < list.length; i++) {
        if (typeof list[i] === 'string') {
          localValue = String(val);
        }

        if (localValue === list[i]) {
          return true;
        }
      }

      return false;
    }

    if (val && val instanceof Array) {
      for (i = 0; i < val.length; i++) {
        if (list.indexOf(val[i]) < 0) {
          return false;
        }
      }
    }

    return true;
  },

  not_in: function(val, req) {
    var list = this.getParameters();
    var len = list.length;
    var returnVal = true;

    for (var i = 0; i < len; i++) {
      var localValue = val;

      if (typeof list[i] === 'string') {
        localValue = String(val);
      }

      if (localValue === list[i]) {
        returnVal = false;
        break;
      }
    }

    return returnVal;
  },

  accepted: function(val) {
    if (val === 'on' || val === 'yes' || val === 1 || val === '1' || val === true) {
      return true;
    }

    return false;
  },

  confirmed: function(val, req, key) {
    var confirmedKey = key + '_confirmation';

    if (this.validator.input[confirmedKey] === val) {
      return true;
    }

    return false;
  },

  integer: function(val) {
    return String(parseInt(val, 10)) === String(val);
  },

  digits: function(val, req) {
    var numericRule = this.validator.getRule('numeric');
    if (numericRule.validate(val) && String(val).length === parseInt(req)) {
      return true;
    }

    return false;
  },

  regex: function(val, req) {
    var mod = /[g|i|m]{1,3}$/;
    var flag = req.match(mod);
    flag = flag ? flag[0] : "";
    req = req.replace(mod, "").slice(1, -1);
    req = new RegExp(req, flag);
    return !!val.match(req);
  },

  date: function(val, format) {
    return isValidDate(val);
  },

  present: function(val) {
    return typeof val !== 'undefined';
  },

  after: function(val, req){
    var val1 = this.validator.input[req];
    var val2 = val;

    if(!isValidDate(val1)){ return false;}
    if(!isValidDate(val2)){ return false;}

    if (new Date(val1).getTime() < new Date(val2).getTime()) {
      return true;
    }

    return false;
  },

   after_or_equal: function(val, req){
    var val1 = this.validator.input[req];
    var val2 = val;

    if(!isValidDate(val1)){ return false;}
    if(!isValidDate(val2)){ return false;}

    if (new Date(val1).getTime() <= new Date(val2).getTime()) {
      return true;
    }

    return false;
  },

  before: function(val, req){
    var val1 = this.validator.input[req];
    var val2 = val;

    if(!isValidDate(val1)){ return false;}
    if(!isValidDate(val2)){ return false;}

    if (new Date(val1).getTime() > new Date(val2).getTime()) {
      return true;
    }

    return false;
  },

   before_or_equal: function(val, req){
    var val1 = this.validator.input[req];
    var val2 = val;

    if(!isValidDate(val1)){ return false;}
    if(!isValidDate(val2)){ return false;}

    if (new Date(val1).getTime() >= new Date(val2).getTime()) {
      return true;
    }

    return false;
  }


};

var missedRuleValidator = function() {
  throw new Error('Validator `' + this.name + '` is not defined!');
};
var missedRuleMessage;

function Rule(name, fn, async) {
  this.name = name;
  this.fn = fn;
  this.passes = null;
  this._customMessage = undefined;
  this.async = async;
}

Rule.prototype = {

  /**
   * Validate rule
   *
   * @param  {mixed} inputValue
   * @param  {mixed} ruleValue
   * @param  {string} attribute
   * @param  {function} callback
   * @return {boolean|undefined}
   */
  validate: function(inputValue, ruleValue, attribute, callback) {
    var _this = this;
    this._setValidatingData(attribute, inputValue, ruleValue);
    if (typeof callback === 'function') {
      this.callback = callback;
      var handleResponse = function(passes, message) {
        _this.response(passes, message);
      };

      if (this.async) {
        return this._apply(inputValue, ruleValue, attribute, handleResponse);
      } else {
        return handleResponse(this._apply(inputValue, ruleValue, attribute));
      }
    }
    return this._apply(inputValue, ruleValue, attribute);
  },

  /**
   * Apply validation function
   *
   * @param  {mixed} inputValue
   * @param  {mixed} ruleValue
   * @param  {string} attribute
   * @param  {function} callback
   * @return {boolean|undefined}
   */
  _apply: function(inputValue, ruleValue, attribute, callback) {
    var fn = this.isMissed() ? missedRuleValidator : this.fn;

    return fn.apply(this, [inputValue, ruleValue, attribute, callback]);
  },

  /**
   * Set validating data
   *
   * @param {string} attribute
   * @param {mixed} inputValue
   * @param {mixed} ruleValue
   * @return {void}
   */
  _setValidatingData: function(attribute, inputValue, ruleValue) {
    this.attribute = attribute;
    this.inputValue = inputValue;
    this.ruleValue = ruleValue;
  },

  /**
   * Get parameters
   *
   * @return {array}
   */
  getParameters: function() {
    var value = [];

    if (typeof this.ruleValue === 'string') {
      value = this.ruleValue.split(',');
    }

    if (typeof this.ruleValue === 'number') {
      value.push(this.ruleValue);
    }

    if (this.ruleValue instanceof Array) {
      value = this.ruleValue;
    }

    return value;
  },

  /**
   * Get true size of value
   *
   * @return {integer|float}
   */
  getSize: function() {
    var value = this.inputValue;

    if (value instanceof Array) {
      return value.length;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (this.validator._hasNumericRule(this.attribute)) {
      return parseFloat(value, 10);
    }

    return value.length;
  },

  /**
   * Get the type of value being checked; numeric or string.
   *
   * @return {string}
   */
  _getValueType: function() {

    if (typeof this.inputValue === 'number' || this.validator._hasNumericRule(this.attribute)) {
      return 'numeric';
    }

    return 'string';
  },

  /**
   * Set the async callback response
   *
   * @param  {boolean|undefined} passes  Whether validation passed
   * @param  {string|undefined} message Custom error message
   * @return {void}
   */
  response: function(passes, message) {
    this.passes = (passes === undefined || passes === true);
    this._customMessage = message;
    this.callback(this.passes, message);
  },

  /**
   * Set validator instance
   *
   * @param {Validator} validator
   * @return {void}
   */
  setValidator: function(validator) {
    this.validator = validator;
  },

  /**
   * Check if rule is missed
   *
   * @return {boolean}
   */
  isMissed: function() {
    return typeof this.fn !== 'function';
  },

  get customMessage() {
    return this.isMissed() ? missedRuleMessage : this._customMessage;
  }
};

var manager = {

  /**
   * List of async rule names
   *
   * @type {Array}
   */
  asyncRules: [],

  /**
   * Implicit rules (rules to always validate)
   *
   * @type {Array}
   */
  implicitRules: ['required', 'required_if', 'required_unless', 'required_with', 'required_with_all', 'required_without', 'required_without_all', 'accepted', 'present'],

  /**
   * Get rule by name
   *
   * @param  {string} name
   * @param {Validator}
   * @return {Rule}
   */
  make: function(name, validator) {
    var async = this.isAsync(name);
    var rule = new Rule(name, rules[name], async);
    rule.setValidator(validator);
    return rule;
  },

  /**
   * Determine if given rule is async
   *
   * @param  {string}  name
   * @return {boolean}
   */
  isAsync: function(name) {
    for (var i = 0, len = this.asyncRules.length; i < len; i++) {
      if (this.asyncRules[i] === name) {
        return true;
      }
    }
    return false;
  },

  /**
   * Determine if rule is implicit (should always validate)
   *
   * @param {string} name
   * @return {boolean}
   */
  isImplicit: function(name) {
    return this.implicitRules.indexOf(name) > -1;
  },

  /**
   * Register new rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  register: function(name, fn) {
    rules[name] = fn;
  },

    /**
   * Register new implicit rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  registerImplicit: function(name, fn) {
    this.register(name, fn);
    this.implicitRules.push(name);
  },

  /**
   * Register async rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  registerAsync: function(name, fn) {
    this.register(name, fn);
    this.asyncRules.push(name);
  },

  /**
   * Register implicit async rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  registerAsyncImplicit: function(name, fn) {
    this.registerImplicit(name, fn);
    this.asyncRules.push(name);
  },

  registerMissedRuleValidator: function(fn, message) {
    missedRuleValidator = fn;
    missedRuleMessage = message;
  }
};



module.exports = manager;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var require;var Messages = __webpack_require__(26);

__webpack_require__(1);

var require_method = require;

var container = {

  messages: {},

  /**
   * Set messages for language
   *
   * @param {string} lang
   * @param {object} rawMessages
   * @return {void}
   */
  _set: function(lang, rawMessages) {
    this.messages[lang] = rawMessages;
  },

  /**
   * Set message for given language's rule.
   *
   * @param {string} lang
   * @param {string} attribute
   * @param {string|object} message
   * @return {void}
   */
  _setRuleMessage: function(lang, attribute, message) {
    this._load(lang);
    if (message === undefined) {
      message = this.messages[lang].def;
    }

    this.messages[lang][attribute] = message;
  },

  /**
   * Load messages (if not already loaded)
   *
   * @param  {string} lang
   * @return {void}
   */
  _load: function(lang) {
    if (!this.messages[lang]) {
      try {
        var rawMessages = __webpack_require__(27)("./" + lang);
        this._set(lang, rawMessages);
      } catch (e) {}
    }
  },

  /**
   * Get raw messages for language
   *
   * @param  {string} lang
   * @return {object}
   */
  _get: function(lang) {
    this._load(lang);
    return this.messages[lang];
  },

  /**
   * Make messages for given language
   *
   * @param  {string} lang
   * @return {Messages}
   */
  _make: function(lang) {
    this._load(lang);
    return new Messages(lang, this.messages[lang]);
  }

};

module.exports = container;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var Attributes = __webpack_require__(4);

var Messages = function(lang, messages) {
  this.lang = lang;
  this.messages = messages;
  this.customMessages = {};
  this.attributeNames = {};
};

Messages.prototype = {
  constructor: Messages,

  /**
   * Set custom messages
   *
   * @param {object} customMessages
   * @return {void}
   */
  _setCustom: function(customMessages) {
    this.customMessages = customMessages || {};
  },

  /**
   * Set custom attribute names.
   *
   * @param {object} attributes
   */
  _setAttributeNames: function(attributes) {
    this.attributeNames = attributes;
  },

  /**
   * Set the attribute formatter.
   *
   * @param {fuction} func
   * @return {void}
   */
  _setAttributeFormatter: function(func) {
    this.attributeFormatter = func;
  },

  /**
   * Get attribute name to display.
   *
   * @param  {string} attribute
   * @return {string}
   */
  _getAttributeName: function(attribute) {
    var name = attribute;
    if (this.attributeNames.hasOwnProperty(attribute)) {
      return this.attributeNames[attribute];
    } else if (this.messages.attributes.hasOwnProperty(attribute)) {
      name = this.messages.attributes[attribute];
    }

    if (this.attributeFormatter) {
      name = this.attributeFormatter(name);
    }

    return name;
  },

  /**
   * Get all messages
   *
   * @return {object}
   */
  all: function() {
    return this.messages;
  },

  /**
   * Render message
   *
   * @param  {Rule} rule
   * @return {string}
   */
  render: function(rule) {
    if (rule.customMessage) {
      return rule.customMessage;
    }
    var template = this._getTemplate(rule);

    var message;
    if (Attributes.replacements[rule.name]) {
      message = Attributes.replacements[rule.name].apply(this, [template, rule]);
    } else {
      message = this._replacePlaceholders(rule, template, {});
    }

    return message;
  },

  /**
   * Get the template to use for given rule
   *
   * @param  {Rule} rule
   * @return {string}
   */
  _getTemplate: function(rule) {

    var messages = this.messages;
    var template = messages.def;
    var customMessages = this.customMessages;
    var formats = [rule.name + '.' + rule.attribute, rule.name];

    for (var i = 0, format; i < formats.length; i++) {
      format = formats[i];
      if (customMessages.hasOwnProperty(format)) {
        template = customMessages[format];
        break;
      } else if (messages.hasOwnProperty(format)) {
        template = messages[format];
        break;
      }
    }

    if (typeof template === 'object') {
      template = template[rule._getValueType()];
    }

    return template;
  },

  /**
   * Replace placeholders in the template using the data object
   *
   * @param  {Rule} rule
   * @param  {string} template
   * @param  {object} data
   * @return {string}
   */
  _replacePlaceholders: function(rule, template, data) {
    var message, attribute;

    data.attribute = this._getAttributeName(rule.attribute);
    data[rule.name] = data[rule.name] || rule.getParameters().join(',');

    if (typeof template === 'string' && typeof data === 'object') {
      message = template;

      for (attribute in data) {
        message = message.replace(new RegExp(':' + attribute, 'g'), data[attribute]);
      }
    }

    return message;
  }

};

module.exports = Messages;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./de": 5,
	"./de.js": 5,
	"./el": 6,
	"./el.js": 6,
	"./en": 1,
	"./en.js": 1,
	"./es": 7,
	"./es.js": 7,
	"./fa": 8,
	"./fa.js": 8,
	"./fr": 9,
	"./fr.js": 9,
	"./it": 10,
	"./it.js": 10,
	"./ja": 11,
	"./ja.js": 11,
	"./nb_NO": 12,
	"./nb_NO.js": 12,
	"./nl": 13,
	"./nl.js": 13,
	"./pl": 14,
	"./pl.js": 14,
	"./pt": 15,
	"./pt.js": 15,
	"./ru": 16,
	"./ru.js": 16,
	"./tr": 17,
	"./tr.js": 17,
	"./ua": 18,
	"./ua.js": 18,
	"./vi": 19,
	"./vi.js": 19,
	"./zh": 20,
	"./zh.js": 20,
	"./zh_TW": 21,
	"./zh_TW.js": 21
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 27;

/***/ }),
/* 28 */
/***/ (function(module, exports) {

var Errors = function() {
  this.errors = {};
};

Errors.prototype = {
  constructor: Errors,

  /**
   * Add new error message for given attribute
   *
   * @param  {string} attribute
   * @param  {string} message
   * @return {void}
   */
  add: function(attribute, message) {
    if (!this.has(attribute)) {
      this.errors[attribute] = [];
    }

    if (this.errors[attribute].indexOf(message) === -1) {
      this.errors[attribute].push(message);
    }
  },

  /**
   * Returns an array of error messages for an attribute, or an empty array
   *
   * @param  {string} attribute A key in the data object being validated
   * @return {array} An array of error messages
   */
  get: function(attribute) {
    if (this.has(attribute)) {
      return this.errors[attribute];
    }

    return [];
  },

  /**
   * Returns the first error message for an attribute, false otherwise
   *
   * @param  {string} attribute A key in the data object being validated
   * @return {string|false} First error message or false
   */
  first: function(attribute) {
    if (this.has(attribute)) {
      return this.errors[attribute][0];
    }

    return false;
  },

  /**
   * Get all error messages from all failing attributes
   *
   * @return {Object} Failed attribute names for keys and an array of messages for values
   */
  all: function() {
    return this.errors;
  },

  /**
   * Determine if there are any error messages for an attribute
   *
   * @param  {string}  attribute A key in the data object being validated
   * @return {boolean}
   */
  has: function(attribute) {
    if (this.errors.hasOwnProperty(attribute)) {
      return true;
    }

    return false;
  }
};

module.exports = Errors;


/***/ }),
/* 29 */
/***/ (function(module, exports) {

function AsyncResolvers(onFailedOne, onResolvedAll) {
  this.onResolvedAll = onResolvedAll;
  this.onFailedOne = onFailedOne;
  this.resolvers = {};
  this.resolversCount = 0;
  this.passed = [];
  this.failed = [];
  this.firing = false;
}

AsyncResolvers.prototype = {

  /**
   * Add resolver
   *
   * @param {Rule} rule
   * @return {integer}
   */
  add: function(rule) {
    var index = this.resolversCount;
    this.resolvers[index] = rule;
    this.resolversCount++;
    return index;
  },

  /**
   * Resolve given index
   *
   * @param  {integer} index
   * @return {void}
   */
  resolve: function(index) {
    var rule = this.resolvers[index];
    if (rule.passes === true) {
      this.passed.push(rule);
    } else if (rule.passes === false) {
      this.failed.push(rule);
      this.onFailedOne(rule);
    }

    this.fire();
  },

  /**
   * Determine if all have been resolved
   *
   * @return {boolean}
   */
  isAllResolved: function() {
    return (this.passed.length + this.failed.length) === this.resolversCount;
  },

  /**
   * Attempt to fire final all resolved callback if completed
   *
   * @return {void}
   */
  fire: function() {

    if (!this.firing) {
      return;
    }

    if (this.isAllResolved()) {
      this.onResolvedAll(this.failed.length === 0);
    }

  },

  /**
   * Enable firing
   *
   * @return {void}
   */
  enableFiring: function() {
    this.firing = true;
  }

};

module.exports = AsyncResolvers;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GRectangePath = exports.GCirclePath = exports.GPath = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by qiyuzhao on 2018-02-02.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _Utility = __webpack_require__(3);

var _Location = __webpack_require__(2);

var _validatorjs = __webpack_require__(0);

var _validatorjs2 = _interopRequireDefault(_validatorjs);

var _polyline = __webpack_require__(31);

var _polyline2 = _interopRequireDefault(_polyline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BasePath = function () {
  function BasePath(options) {
    _classCallCheck(this, BasePath);

    this.options = {
      weight: null,
      color: null,
      fillcolor: null,
      geodesic: null
    };
    this.rules = {
      weight: 'integer',
      color: 'string',
      fillcolor: 'string',
      geodesic: 'boolean'
    };
  }

  _createClass(BasePath, [{
    key: 'getOptions',
    value: function getOptions() {
      return this.options;
    }
  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      this.options = Object.assign(this.options, options);

      //specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF),
      // or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}.
      var validatePath = new _validatorjs2.default(this.options, this.rules);

      if (validatePath.fails()) {
        console.error(this.constructor.name + ' validation failed:', validatePath.errors);
      }
    }
  }, {
    key: '_calculateLatLng',
    value: function _calculateLatLng(originLatLng, distance, angle) {
      var lat = originLatLng.lat * Math.PI / 180;
      var lng = originLatLng.lng * Math.PI / 180;
      var d = distance / 1000 / 6371;

      var tempLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(angle));
      var tempLng = (lng + Math.atan2(Math.sin(angle) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(tempLat))) * 180 / Math.PI;
      tempLat = tempLat * 180 / Math.PI;
      return { lat: tempLat, lng: tempLng };
    }
  }]);

  return BasePath;
}();

var GPath = function (_BasePath) {
  _inherits(GPath, _BasePath);

  function GPath(options) {
    _classCallCheck(this, GPath);

    var _this = _possibleConstructorReturn(this, (GPath.__proto__ || Object.getPrototypeOf(GPath)).call(this, options));

    _this.options = Object.assign(_this.options, { locations: [] });
    _this.rules = Object.assign(_this.rules, { locations: 'required|array' });
    _this.setOptions(options);
    return _this;
  }

  _createClass(GPath, [{
    key: 'toString',
    value: function toString() {
      var _this2 = this;

      var util = new _Utility.Utility();
      var options = util.cleanObject(this.options);
      var params = [];

      for (var i in options) {
        (function () {
          switch (i) {
            case 'locations':
              var locations = [];
              options[i].forEach(function (l) {
                locations.push(l.toArray());
              });
              params.push('enc:' + _polyline2.default.encode(locations));
              //params.push(options[i].join('|')); // with numeric geo location.
              break;
            case 'geodesic':
              if (_this2.options.geodesic === true) {
                params.push(i + ':true');
              } else if (_this2.options.geodesic === false) {
                params.push(i + ':false');
              }
              break;
            default:
              params.push(i + ':' + options[i].toString());
          }
        })();
      }
      return 'path=' + params.join('|');
    }
  }, {
    key: 'addLocations',
    value: function addLocations(location) {
      this.options.locations.push(location);
    }
  }, {
    key: 'clearLocations',
    value: function clearLocations() {
      this.options.locations = [];
    }
  }]);

  return GPath;
}(BasePath);

var GCirclePath = function (_BasePath2) {
  _inherits(GCirclePath, _BasePath2);

  function GCirclePath(options) {
    _classCallCheck(this, GCirclePath);

    var _this3 = _possibleConstructorReturn(this, (GCirclePath.__proto__ || Object.getPrototypeOf(GCirclePath)).call(this, options));

    _this3.options = Object.assign(_this3.options, {
      location: null,
      radius: null,
      detail: 8
    });
    _this3.rules = Object.assign(_this3.rules, {
      location: 'required',
      radius: 'numeric|required', // unit of meters
      detail: 'integer|min:8|max:20'
    });
    _this3.setOptions(options);
    return _this3;
  }

  _createClass(GCirclePath, [{
    key: 'toString',
    value: function toString() {
      var locations = [];

      for (var i = 0; i <= 365; i += this.options.detail) {
        var tempLatLng = this._calculateLatLng(this.options.location.location, this.options.radius, i * Math.PI / 180);
        locations.push(new _Location.Location({ lat: tempLatLng.lat, lng: tempLatLng.lng }));
      }
      var myPath = new GPath({
        weight: this.options.weight,
        color: this.options.color,
        fillcolor: this.options.fillcolor,
        geodesic: this.options.geodesic,
        locations: locations
      });
      return myPath.toString();
    }
  }]);

  return GCirclePath;
}(BasePath);

var GRectangePath = function (_BasePath3) {
  _inherits(GRectangePath, _BasePath3);

  function GRectangePath(options) {
    _classCallCheck(this, GRectangePath);

    var _this4 = _possibleConstructorReturn(this, (GRectangePath.__proto__ || Object.getPrototypeOf(GRectangePath)).call(this, options));

    _this4.options = Object.assign(_this4.options, {
      location: null,
      width: null,
      height: null
    });
    _this4.rules = Object.assign(_this4.rules, {
      location: 'required',
      width: 'numeric|required', // unit of meters
      height: 'numeric|required' // unit of meters
    });
    _this4.setOptions(options);
    return _this4;
  }

  _createClass(GRectangePath, [{
    key: 'toString',
    value: function toString() {
      var latlng = this.options.location.toArray();
      latlng = {
        lat: latlng[0],
        lng: latlng[1]
      };
      var distance = Math.sqrt(Math.pow(this.options.width, 2) + Math.pow(this.options.height, 2)) / 2;
      var degree = Math.atan(this.options.width / this.options.height);
      var locations = [new _Location.Location(this._calculateLatLng(latlng, distance, degree)), new _Location.Location(this._calculateLatLng(latlng, distance, Math.PI - degree)), new _Location.Location(this._calculateLatLng(latlng, distance, degree + Math.PI)), new _Location.Location(this._calculateLatLng(latlng, distance, -degree)), new _Location.Location(this._calculateLatLng(latlng, distance, degree))];
      console.log(locations);
      var myPath = new GPath({
        weight: this.options.weight,
        color: this.options.color,
        fillcolor: this.options.fillcolor,
        geodesic: this.options.geodesic,
        locations: locations
      });
      return myPath.toString();
    }
  }]);

  return GRectangePath;
}(BasePath);

exports.GPath = GPath;
exports.GCirclePath = GCirclePath;
exports.GRectangePath = GRectangePath;

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 *
 * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
 * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
 *
 * @module polyline
 */

var polyline = {};

function py2_round(value) {
    // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
    return Math.floor(Math.abs(value) + 0.5) * Math.sign(value);
}

function encode(current, previous, factor) {
    current = py2_round(current * factor);
    previous = py2_round(previous * factor);
    var coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 */
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Encodes the given [latitude, longitude] coordinates array.
 *
 * @param {Array.<Array.<Number>>} coordinates
 * @param {Number} precision
 * @returns {String}
 */
polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) { return ''; }

    var factor = Math.pow(10, precision || 5),
        output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
    }

    return output;
};

function flipped(coords) {
    var flipped = [];
    for (var i = 0; i < coords.length; i++) {
        flipped.push(coords[i].slice().reverse());
    }
    return flipped;
}

/**
 * Encodes a GeoJSON LineString feature/geometry.
 *
 * @param {Object} geojson
 * @param {Number} precision
 * @returns {String}
 */
polyline.fromGeoJSON = function(geojson, precision) {
    if (geojson && geojson.type === 'Feature') {
        geojson = geojson.geometry;
    }
    if (!geojson || geojson.type !== 'LineString') {
        throw new Error('Input must be a GeoJSON LineString');
    }
    return polyline.encode(flipped(geojson.coordinates), precision);
};

/**
 * Decodes to a GeoJSON LineString geometry.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Object}
 */
polyline.toGeoJSON = function(str, precision) {
    var coords = polyline.decode(str, precision);
    return {
        type: 'LineString',
        coordinates: flipped(coords)
    };
};

if (typeof module === 'object' && module.exports) {
    module.exports = polyline;
}


/***/ })
/******/ ]);