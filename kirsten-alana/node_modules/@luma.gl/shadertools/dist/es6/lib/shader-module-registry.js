import ShaderModule from './shader-module';
import { assert } from '../utils';
export default class ShaderModuleRegistry {
  constructor() {
    this.shaderModules = {};
    this.defaultShaderModules = [];
  }

  setDefaultShaderModules(modules) {
    this.defaultShaderModules = this.resolveModules(modules);
  }

  registerShaderModules(shaderModuleList) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$ignoreMultipleRe = _ref.ignoreMultipleRegistrations,
        ignoreMultipleRegistrations = _ref$ignoreMultipleRe === void 0 ? false : _ref$ignoreMultipleRe;

    for (const shaderModule of shaderModuleList) {
      this._registerShaderModule(shaderModule, ignoreMultipleRegistrations);
    }
  }

  getShaderModule(moduleOrName) {
    if (moduleOrName instanceof ShaderModule) {
      return moduleOrName;
    }

    if (typeof moduleOrName !== 'string') {
      return this._registerShaderModule(moduleOrName, true);
    }

    const module = this.shaderModules[moduleOrName];

    if (!module) {
      assert(false, "Unknown shader module ".concat(moduleOrName));
    }

    return module;
  }

  resolveModules(modules) {
    return modules.map(moduleOrName => this.getShaderModule(moduleOrName));
  }

  _registerShaderModule(module) {
    let ignoreMultipleRegistrations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (module instanceof ShaderModule) {
      return module;
    }

    assert(module.name, 'shader module has no name');

    if (!this.shaderModules[module.name] || ignoreMultipleRegistrations) {
      module = new ShaderModule(module);
      module.dependencies = this.resolveModules(module.dependencies);
      this.shaderModules[module.name] = module;
    } else {
      throw new Error("shader module ".concat(module.name, " already registered"));
    }

    return this.shaderModules[module.name];
  }

}
//# sourceMappingURL=shader-module-registry.js.map