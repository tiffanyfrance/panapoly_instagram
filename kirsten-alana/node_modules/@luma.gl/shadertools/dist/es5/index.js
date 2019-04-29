"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "registerShaderModules", {
  enumerable: true,
  get: function get() {
    return _resolveModules.registerShaderModules;
  }
});
Object.defineProperty(exports, "setDefaultShaderModules", {
  enumerable: true,
  get: function get() {
    return _resolveModules.setDefaultShaderModules;
  }
});
Object.defineProperty(exports, "assembleShaders", {
  enumerable: true,
  get: function get() {
    return _assembleShaders.assembleShaders;
  }
});
Object.defineProperty(exports, "combineInjects", {
  enumerable: true,
  get: function get() {
    return _injectShader.combineInjects;
  }
});
Object.defineProperty(exports, "normalizeShaderModule", {
  enumerable: true,
  get: function get() {
    return _normalizeModule.normalizeShaderModule;
  }
});
Object.defineProperty(exports, "getQualifierDetails", {
  enumerable: true,
  get: function get() {
    return _shaderUtils.getQualifierDetails;
  }
});
Object.defineProperty(exports, "getPassthroughFS", {
  enumerable: true,
  get: function get() {
    return _shaderUtils.getPassthroughFS;
  }
});
Object.defineProperty(exports, "typeToChannelSuffix", {
  enumerable: true,
  get: function get() {
    return _shaderUtils.typeToChannelSuffix;
  }
});
Object.defineProperty(exports, "typeToChannelCount", {
  enumerable: true,
  get: function get() {
    return _shaderUtils.typeToChannelCount;
  }
});
Object.defineProperty(exports, "convertToVec4", {
  enumerable: true,
  get: function get() {
    return _shaderUtils.convertToVec4;
  }
});
Object.defineProperty(exports, "fp32", {
  enumerable: true,
  get: function get() {
    return _fp["default"];
  }
});
Object.defineProperty(exports, "fp64", {
  enumerable: true,
  get: function get() {
    return _fp2["default"];
  }
});
Object.defineProperty(exports, "project", {
  enumerable: true,
  get: function get() {
    return _project["default"];
  }
});
Object.defineProperty(exports, "lights", {
  enumerable: true,
  get: function get() {
    return _lights["default"];
  }
});
Object.defineProperty(exports, "dirlight", {
  enumerable: true,
  get: function get() {
    return _dirlight["default"];
  }
});
Object.defineProperty(exports, "picking", {
  enumerable: true,
  get: function get() {
    return _picking["default"];
  }
});
Object.defineProperty(exports, "diffuse", {
  enumerable: true,
  get: function get() {
    return _diffuse["default"];
  }
});
Object.defineProperty(exports, "gouraudlighting", {
  enumerable: true,
  get: function get() {
    return _phongLighting.gouraudlighting;
  }
});
Object.defineProperty(exports, "phonglighting", {
  enumerable: true,
  get: function get() {
    return _phongLighting.phonglighting;
  }
});
Object.defineProperty(exports, "pbr", {
  enumerable: true,
  get: function get() {
    return _pbr["default"];
  }
});
Object.defineProperty(exports, "_transform", {
  enumerable: true,
  get: function get() {
    return _transform["default"];
  }
});
exports.MODULAR_SHADERS = void 0;

var _modularVertex = _interopRequireDefault(require("./shaders/modular-vertex.glsl"));

var _modularFragment = _interopRequireDefault(require("./shaders/modular-fragment.glsl"));

var _resolveModules = require("./lib/resolve-modules");

var _assembleShaders = require("./lib/assemble-shaders");

var _injectShader = require("./lib/inject-shader");

var _normalizeModule = require("./lib/filters/normalize-module");

var _shaderUtils = require("./utils/shader-utils");

var _fp = _interopRequireDefault(require("./modules/fp32/fp32"));

var _fp2 = _interopRequireDefault(require("./modules/fp64/fp64"));

var _project = _interopRequireDefault(require("./modules/project/project"));

var _lights = _interopRequireDefault(require("./modules/lights/lights"));

var _dirlight = _interopRequireDefault(require("./modules/dirlight/dirlight"));

var _picking = _interopRequireDefault(require("./modules/picking/picking"));

var _diffuse = _interopRequireDefault(require("./modules/diffuse/diffuse"));

var _phongLighting = require("./modules/phong-lighting/phong-lighting");

var _pbr = _interopRequireDefault(require("./modules/pbr/pbr"));

var _transform = _interopRequireDefault(require("./modules/transform/transform"));

var MODULAR_SHADERS = {
  vs: _modularVertex["default"],
  fs: _modularFragment["default"],
  defaultUniforms: {}
};
exports.MODULAR_SHADERS = MODULAR_SHADERS;
//# sourceMappingURL=index.js.map