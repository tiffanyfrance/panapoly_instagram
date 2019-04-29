import { parsePropTypes } from './prop-types';

function defaultGetUniforms(module, props) {
  const uniforms = {};

  if (props === undefined) {
    for (const key in module.uniforms) {
      uniforms[key] = module.uniforms[key].value;
    }

    return uniforms;
  }

  for (const key in props) {
    uniforms[key] = props[key];
  }

  return uniforms;
}

export function normalizeShaderModule(module) {
  if (!module.normalized) {
    module.normalized = true;

    if (module.uniforms) {
      const _parsePropTypes = parsePropTypes(module.uniforms),
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