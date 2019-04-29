import { assert } from '../utils';
const shaderModules = {};
let defaultShaderModules = [];
export function registerShaderModules(shaderModuleList) {
  let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$ignoreMultipleRe = _ref.ignoreMultipleRegistrations,
      ignoreMultipleRegistrations = _ref$ignoreMultipleRe === void 0 ? false : _ref$ignoreMultipleRe;

  for (const shaderModule of shaderModuleList) {
    registerShaderModule(shaderModule, {
      ignoreMultipleRegistrations
    });
  }
}
export function setDefaultShaderModules(modules) {
  defaultShaderModules = modules;
}
export function getShaderModule(moduleOrName) {
  if (typeof moduleOrName !== 'string') {
    const shaderModule = moduleOrName;
    assert(typeof shaderModule.name === 'string');
    registerShaderModule(shaderModule, {
      ignoreMultipleRegistrations: true
    });
    return shaderModule;
  }

  const shaderModule = shaderModules[moduleOrName];

  if (!shaderModule) {
    assert(false, "Unknown shader module ".concat(moduleOrName));
  }

  return shaderModule;
}
export function resolveModules(modules) {
  const moduleNames = modules.map(module => {
    if (typeof module !== 'string') {
      registerShaderModules([module], {
        ignoreMultipleRegistrations: true
      });
      return module.name;
    }

    return module;
  });
  return getShaderDependencies(moduleNames);
}
export function getShaderDependencies(modules) {
  modules = modules.concat(defaultShaderModules);
  const result = {};
  getDependencyGraph({
    modules,
    level: 0,
    result
  });
  return Object.keys(result).sort((a, b) => result[b] - result[a]);
}
export function getDependencyGraph(_ref2) {
  let modules = _ref2.modules,
      level = _ref2.level,
      result = _ref2.result;

  if (level >= 5) {
    throw new Error('Possible loop in shader dependency graph');
  }

  for (const moduleOrName of modules) {
    const shaderModule = getShaderModule(moduleOrName);

    if (result[shaderModule.name] === undefined || result[shaderModule.name] < level) {
      result[shaderModule.name] = level;
    }
  }

  for (const moduleOrName of modules) {
    const shaderModule = getShaderModule(moduleOrName);

    if (shaderModule.dependencies) {
      getDependencyGraph({
        modules: shaderModule.dependencies,
        level: level + 1,
        result
      });
    }
  }

  return result;
}

function parseDeprecationDefinitions() {
  let deprecations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  deprecations.forEach(def => {
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

function registerShaderModule(shaderModule, _ref3) {
  let _ref3$ignoreMultipleR = _ref3.ignoreMultipleRegistrations,
      ignoreMultipleRegistrations = _ref3$ignoreMultipleR === void 0 ? false : _ref3$ignoreMultipleR;
  assert(shaderModule.name, 'shader module has no name');

  if (!ignoreMultipleRegistrations && shaderModules[shaderModule.name]) {
    throw new Error("shader module ".concat(shaderModule.name, " already registered"));
  }

  shaderModules[shaderModule.name] = shaderModule;
  shaderModule.dependencies = shaderModule.dependencies || [];
  shaderModule.deprecations = parseDeprecationDefinitions(shaderModule.deprecations);
}
//# sourceMappingURL=shader-modules.js.map