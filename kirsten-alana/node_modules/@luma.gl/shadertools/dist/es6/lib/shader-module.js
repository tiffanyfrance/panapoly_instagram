import transpileShader from './transpile-shader';
import { assert } from '../utils';
const VERTEX_SHADER = 'vs';
const FRAGMENT_SHADER = 'fs';
export default class ShaderModule {
  constructor(_ref) {
    let name = _ref.name,
        vs = _ref.vs,
        fs = _ref.fs,
        _ref$dependencies = _ref.dependencies,
        dependencies = _ref$dependencies === void 0 ? [] : _ref$dependencies,
        _ref$getUniforms = _ref.getUniforms,
        getUniforms = _ref$getUniforms === void 0 ? () => ({}) : _ref$getUniforms,
        _ref$deprecations = _ref.deprecations,
        deprecations = _ref$deprecations === void 0 ? [] : _ref$deprecations,
        _ref$defines = _ref.defines,
        defines = _ref$defines === void 0 ? {} : _ref$defines,
        vertexShader = _ref.vertexShader,
        fragmentShader = _ref.fragmentShader;
    assert(typeof name === 'string');
    this.name = name;
    this.vs = vs || vertexShader;
    this.fs = fs || fragmentShader;
    this.getModuleUniforms = getUniforms;
    this.dependencies = dependencies;
    this.deprecations = this._parseDeprecationDefinitions(deprecations);
    this.defines = defines;
  }

  getModuleSource(type, targetGLSLVersion) {
    let moduleSource;

    switch (type) {
      case VERTEX_SHADER:
        moduleSource = transpileShader(this.vs || '', targetGLSLVersion, true);
        break;

      case FRAGMENT_SHADER:
        moduleSource = transpileShader(this.fs || '', targetGLSLVersion, false);
        break;

      default:
        assert(false);
    }

    if (typeof moduleSource !== 'string') {
      return '';
    }

    return "#define MODULE_".concat(this.name.toUpperCase(), "\n").concat(moduleSource, "// END MODULE_").concat(this.name, "\n\n");
  }

  getUniforms(opts, uniforms) {
    return this.getModuleUniforms(opts, uniforms);
  }

  getDefines() {
    return this.defines;
  }

  checkDeprecations(shaderSource, log) {
    this.deprecations.forEach(def => {
      if (def.regex.test(shaderSource)) {
        if (def.deprecated && log) {
          log.deprecated(def.old, def.new)();
        } else if (log) {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions() {
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

}
//# sourceMappingURL=shader-module.js.map