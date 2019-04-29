import lightingShader from './lights.glsl';
export default {
  name: 'lights',
  vs: lightingShader,
  fs: lightingShader,
  getUniforms,
  defines: {
    MAX_LIGHTS: 3
  }
};
const INITIAL_MODULE_OPTIONS = {};

function convertColor() {
  let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$color = _ref.color,
      color = _ref$color === void 0 ? [0, 0, 0] : _ref$color,
      _ref$intensity = _ref.intensity,
      intensity = _ref$intensity === void 0 ? 1.0 : _ref$intensity;

  return color.map(component => component * intensity / 255.0);
}

function getLightSourceUniforms(_ref2) {
  let ambientLight = _ref2.ambientLight,
      _ref2$pointLights = _ref2.pointLights,
      pointLights = _ref2$pointLights === void 0 ? [] : _ref2$pointLights,
      _ref2$directionalLigh = _ref2.directionalLights,
      directionalLights = _ref2$directionalLigh === void 0 ? [] : _ref2$directionalLigh;
  const lightSourceUniforms = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_uAmbientLight.color'] = convertColor(ambientLight);
  } else {
    lightSourceUniforms['lighting_uAmbientLight.color'] = [0, 0, 0];
  }

  pointLights.forEach((pointLight, index) => {
    lightSourceUniforms["lighting_uPointLight[".concat(index, "].color")] = convertColor(pointLight);
    lightSourceUniforms["lighting_uPointLight[".concat(index, "].position")] = pointLight.position;
    lightSourceUniforms["lighting_uPointLight[".concat(index, "].attenuation")] = pointLight.attenuation;
  });
  lightSourceUniforms.lighting_uPointLightCount = pointLights.length;
  directionalLights.forEach((directionalLight, index) => {
    lightSourceUniforms["lighting_uDirectionalLight[".concat(index, "].color")] = convertColor(directionalLight);
    lightSourceUniforms["lighting_uDirectionalLight[".concat(index, "].direction")] = directionalLight.direction;
  });
  lightSourceUniforms.lighting_uDirectionalLightCount = directionalLights.length;
  return lightSourceUniforms;
}

function getUniforms() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : INITIAL_MODULE_OPTIONS;

  if ('lightSources' in opts) {
    const _ref3 = opts.lightSources || {},
          ambientLight = _ref3.ambientLight,
          pointLights = _ref3.pointLights,
          directionalLights = _ref3.directionalLights;

    const hasLights = ambientLight || pointLights && pointLights.length > 0 || directionalLights && directionalLights.length > 0;

    if (!hasLights) {
      return {
        lighting_uEnabled: false
      };
    }

    return Object.assign({}, getLightSourceUniforms({
      ambientLight,
      pointLights,
      directionalLights
    }), {
      lighting_uEnabled: true
    });
  }

  if ('lights' in opts) {
    const lightSources = {
      pointLights: [],
      directionalLights: []
    };

    for (const light of opts.lights || []) {
      switch (light.type) {
        case 'ambient':
          lightSources.ambientLight = light;
          break;

        case 'directional':
          lightSources.directionalLights.push(light);
          break;

        case 'point':
          lightSources.pointLights.push(light);
          break;

        default:
      }
    }

    return getUniforms({
      lightSources
    });
  }

  return {};
}
//# sourceMappingURL=lights.js.map