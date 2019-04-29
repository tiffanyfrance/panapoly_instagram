"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = injectShader;
exports.combineInjects = combineInjects;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _moduleInjectors = require("../modules/module-injectors");

var _constants = require("./constants");

var _utils = require("../utils");

var _MODULE_INJECTORS;

var MODULE_INJECTORS = (_MODULE_INJECTORS = {}, (0, _defineProperty2["default"])(_MODULE_INJECTORS, _constants.VERTEX_SHADER, _moduleInjectors.MODULE_INJECTORS_VS), (0, _defineProperty2["default"])(_MODULE_INJECTORS, _constants.FRAGMENT_SHADER, _moduleInjectors.MODULE_INJECTORS_FS), _MODULE_INJECTORS);
var REGEX_START_OF_MAIN = /void main\s*\([^)]*\)\s*\{\n?/;
var REGEX_END_OF_MAIN = /}\n?[^{}]*$/;

function injectShader(source, type, inject, injectStandardStubs) {
  var isVertex = type === _constants.VERTEX_SHADER;

  var _loop = function _loop(key) {
    var fragment = inject[key];

    switch (key) {
      case 'vs:#decl':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, function (match) {
            return "".concat(fragment, "\n").concat(match);
          });
        }

        break;

      case 'vs:#main-start':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, function (match) {
            return match + fragment;
          });
        }

        break;

      case 'vs:#main-end':
        if (isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, function (match) {
            return fragment + match;
          });
        }

        break;

      case 'fs:#decl':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, function (match) {
            return "".concat(fragment, "\n").concat(match);
          });
        }

        break;

      case 'fs:#main-start':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, function (match) {
            return match + fragment;
          });
        }

        break;

      case 'fs:#main-end':
        if (!isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, function (match) {
            return fragment + match;
          });
        }

        break;

      default:
        source = source.replace(key, function (match) {
          return match + fragment;
        });
    }
  };

  for (var key in inject) {
    _loop(key);
  }

  if (injectStandardStubs) {
    source = source.replace('}s*$', function (match) {
      return match + MODULE_INJECTORS[type];
    });
  }

  return source;
}

function combineInjects(injects) {
  var result = {};
  (0, _utils.assert)(Array.isArray(injects) && injects.length > 1);
  injects.forEach(function (inject) {
    for (var key in inject) {
      result[key] = result[key] ? "".concat(result[key], "\n").concat(inject[key]) : inject[key];
    }
  });
  return result;
}
//# sourceMappingURL=inject-shader.js.map