"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _tapeCatch = _interopRequireDefault(require("tape-catch"));

var _shadertools = require("@luma.gl/shadertools");

(0, _tapeCatch["default"])('shadertools#lights', function (t) {
  var uniforms = _shadertools.lights.getUniforms();

  t.ok(uniforms, 'Generated default uniforms');
  uniforms = _shadertools.lights.getUniforms({
    lights: [{
      type: 'ambient'
    }, {
      type: 'directional'
    }, {
      type: 'point'
    }]
  });
  t.ok(uniforms, 'Generated uniforms for empty lights');
  uniforms = _shadertools.lights.getUniforms({
    lights: [{
      type: 'non-existing'
    }]
  });
  t.ok(uniforms, 'Generated uniforms for non-supported light object');
  t.end();
});
//# sourceMappingURL=lights.spec.js.map