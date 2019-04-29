"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _transpileShader = _interopRequireDefault(require("./transpile-shader"));

var _utils = require("../utils");

var VERTEX_SHADER = 'vs';
var FRAGMENT_SHADER = 'fs';

var ShaderModule = function () {
  function ShaderModule(_ref) {
    var name = _ref.name,
        vs = _ref.vs,
        fs = _ref.fs,
        _ref$dependencies = _ref.dependencies,
        dependencies = _ref$dependencies === void 0 ? [] : _ref$dependencies,
        _ref$getUniforms = _ref.getUniforms,
        getUniforms = _ref$getUniforms === void 0 ? function () {
      return {};
    } : _ref$getUniforms,
        _ref$deprecations = _ref.deprecations,
        deprecations = _ref$deprecations === void 0 ? [] : _ref$deprecations,
        _ref$defines = _ref.defines,
        defines = _ref$defines === void 0 ? {} : _ref$defines,
        vertexShader = _ref.vertexShader,
        fragmentShader = _ref.fragmentShader;
    (0, _classCallCheck2["default"])(this, ShaderModule);
    (0, _utils.assert)(typeof name === 'string');
    this.name = name;
    this.vs = vs || vertexShader;
    this.fs = fs || fragmentShader;
    this.getModuleUniforms = getUniforms;
    this.dependencies = dependencies;
    this.deprecations = this._parseDeprecationDefinitions(deprecations);
    this.defines = defines;
  }

  (0, _createClass2["default"])(ShaderModule, [{
    key: "getModuleSource",
    value: function getModuleSource(type, targetGLSLVersion) {
      var moduleSource;

      switch (type) {
        case VERTEX_SHADER:
          moduleSource = (0, _transpileShader["default"])(this.vs || '', targetGLSLVersion, true);
          break;

        case FRAGMENT_SHADER:
          moduleSource = (0, _transpileShader["default"])(this.fs || '', targetGLSLVersion, false);
          break;

        default:
          (0, _utils.assert)(false);
      }

      if (typeof moduleSource !== 'string') {
        return '';
      }

      return "#define MODULE_".concat(this.name.toUpperCase(), "\n").concat(moduleSource, "// END MODULE_").concat(this.name, "\n\n");
    }
  }, {
    key: "getUniforms",
    value: function getUniforms(opts, uniforms) {
      return this.getModuleUniforms(opts, uniforms);
    }
  }, {
    key: "getDefines",
    value: function getDefines() {
      return this.defines;
    }
  }, {
    key: "checkDeprecations",
    value: function checkDeprecations(shaderSource, log) {
      this.deprecations.forEach(function (def) {
        if (def.regex.test(shaderSource)) {
          if (def.deprecated && log) {
            log.deprecated(def.old, def["new"])();
          } else if (log) {
            log.removed(def.old, def["new"])();
          }
        }
      });
    }
  }, {
    key: "_parseDeprecationDefinitions",
    value: function _parseDeprecationDefinitions() {
      var deprecations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      deprecations.forEach(function (def) {
        switch (def.type) {
          case 'function':
            def.regex = new RegExp("\\b".concat(def.old, "\\("));
            break;

          default:
            def.regex = new RegExp("".concat(def.type, " ").concat(def.old, ";"));
        }
      });
      return deprecations;
    }
  }]);
  return ShaderModule;
}();

exports["default"] = ShaderModule;
//# sourceMappingURL=shader-module.js.map