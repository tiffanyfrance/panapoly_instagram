import ShaderModuleRegistry from './shader-module-registry';
const shaderModuleRegistry = new ShaderModuleRegistry();
export function setDefaultShaderModules(modules) {
  shaderModuleRegistry.setDefaultShaderModules(modules);
}
export function registerShaderModules(shaderModuleList) {
  let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$ignoreMultipleRe = _ref.ignoreMultipleRegistrations,
      ignoreMultipleRegistrations = _ref$ignoreMultipleRe === void 0 ? false : _ref$ignoreMultipleRe;

  shaderModuleRegistry.registerShaderModules(shaderModuleList, {
    ignoreMultipleRegistrations
  });
}
export function resolveModules(modules) {
  modules = modules.concat(shaderModuleRegistry.defaultShaderModules);
  modules = shaderModuleRegistry.resolveModules(modules);
  return getShaderDependencies(modules);
}
export function getShaderModule(moduleOrName) {
  return shaderModuleRegistry.getShaderModule(moduleOrName);
}

function getShaderDependencies(modules) {
  const moduleMap = {};
  const moduleDepth = {};
  getDependencyGraph({
    modules,
    level: 0,
    moduleMap,
    moduleDepth
  });
  return Object.keys(moduleDepth).sort((a, b) => moduleDepth[b] - moduleDepth[a]).map(name => moduleMap[name]);
}

function getDependencyGraph(_ref2) {
  let modules = _ref2.modules,
      level = _ref2.level,
      moduleMap = _ref2.moduleMap,
      moduleDepth = _ref2.moduleDepth;

  if (level >= 5) {
    throw new Error('Possible loop in shader dependency graph');
  }

  for (const module of modules) {
    moduleMap[module.name] = module;

    if (moduleDepth[module.name] === undefined || moduleDepth[module.name] < level) {
      moduleDepth[module.name] = level;
    }
  }

  for (const module of modules) {
    if (module.dependencies) {
      getDependencyGraph({
        modules: module.dependencies,
        level: level + 1,
        moduleMap,
        moduleDepth
      });
    }
  }
}

export const TEST_EXPORTS = {
  getShaderDependencies,
  getDependencyGraph
};
//# sourceMappingURL=resolve-modules.js.map