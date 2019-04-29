import { parsePropTypes } from './prop-types';

function defaultGetUniforms(module, props) {
  var uniforms = {};

  if (props === undefined) {
    for (var key in module.uniforms) {
      uniforms[key] = module.uniforms[key].value;
    }

    return uniforms;
  }

  for (var _key in props) {
    uniforms[_key] = props[_key];
  }

  return uniforms;
}

export function normalizeShaderModule(module) {
  if (!module.normalized) {
    module.normalized = true;

    if (module.uniforms) {
      var _parsePropTypes = parsePropTypes(module.uniforms),
          propTypes = _parsePropTypes.propTypes;

      module.uniforms = propTypes;
    }

    if (module.uniforms && !module.getUniforms) {
      module.getUniforms = defaultGetUniforms.bind(null, module);
    }
  }

  return module;
}
//# sourceMappingURL=normalize-module.js.map