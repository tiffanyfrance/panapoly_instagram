import { VERTEX_SHADER, FRAGMENT_SHADER } from './constants';
import { resolveModules, getShaderModule } from './resolve-modules';
import { getPlatformShaderDefines, getVersionDefines } from './platform-defines';
import injectShader from './inject-shader';
import { assert } from '../utils';
const SHADER_TYPE = {
  [VERTEX_SHADER]: 'vertex',
  [FRAGMENT_SHADER]: 'fragment'
};
const FRAGMENT_SHADER_PROLOGUE = "precision highp float;\n\n";
export function assembleShaders(gl) {
  let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const vs = opts.vs,
        fs = opts.fs;
  const modules = resolveModules(opts.modules || []);
  return {
    gl,
    vs: assembleShader(gl, Object.assign({}, opts, {
      source: vs,
      type: VERTEX_SHADER,
      modules
    })),
    fs: assembleShader(gl, Object.assign({}, opts, {
      source: fs,
      type: FRAGMENT_SHADER,
      modules
    })),
    getUniforms: assembleGetUniforms(modules),
    modules: assembleModuleMap(modules)
  };
}

function assembleShader(gl, _ref) {
  let id = _ref.id,
      source = _ref.source,
      type = _ref.type,
      _ref$modules = _ref.modules,
      modules = _ref$modules === void 0 ? [] : _ref$modules,
      _ref$defines = _ref.defines,
      defines = _ref$defines === void 0 ? {} : _ref$defines,
      _ref$inject = _ref.inject,
      inject = _ref$inject === void 0 ? {} : _ref$inject,
      _ref$prologue = _ref.prologue,
      prologue = _ref$prologue === void 0 ? true : _ref$prologue,
      log = _ref.log;
  assert(typeof source === 'string', 'shader source must be a string');
  const isVertex = type === VERTEX_SHADER;
  const sourceLines = source.split('\n');
  let glslVersion = 100;
  let versionLine = '';
  let coreSource = source;

  if (sourceLines[0].indexOf('#version ') === 0) {
    glslVersion = 300;
    versionLine = sourceLines[0];
    coreSource = sourceLines.slice(1).join('\n');
  }

  const allDefines = {};
  modules.forEach(module => {
    Object.assign(allDefines, module.getDefines());
  });
  Object.assign(allDefines, defines);
  let assembledSource = prologue ? "".concat(versionLine, "\n").concat(getShaderName({
    id,
    source,
    type
  }), "\n").concat(getShaderType({
    type
  }), "\n").concat(getPlatformShaderDefines(gl), "\n").concat(getVersionDefines(gl, glslVersion, !isVertex), "\n").concat(getApplicationDefines(allDefines), "\n").concat(isVertex ? '' : FRAGMENT_SHADER_PROLOGUE, "\n") : "".concat(versionLine, "\n");
  let injectStandardStubs = false;

  for (const module of modules) {
    switch (module.name) {
      case 'inject':
        injectStandardStubs = true;
        break;

      default:
        module.checkDeprecations(coreSource, log);
        const moduleSource = module.getModuleSource(type, glslVersion);
        assembledSource += moduleSource;
    }
  }

  assembledSource += coreSource;
  assembledSource = injectShader(assembledSource, type, inject, injectStandardStubs);
  return assembledSource;
}

function assembleGetUniforms(modules) {
  return function getUniforms(opts) {
    const uniforms = {};

    for (const module of modules) {
      const moduleUniforms = module.getUniforms(opts, uniforms);
      Object.assign(uniforms, moduleUniforms);
    }

    return uniforms;
  };
}

function assembleModuleMap(modules) {
  const result = {};

  for (const moduleName of modules) {
    const shaderModule = getShaderModule(moduleName);
    result[moduleName] = shaderModule;
  }

  return result;
}

function getShaderType(_ref2) {
  let type = _ref2.type;
  return "\n#define SHADER_TYPE_".concat(SHADER_TYPE[type].toUpperCase(), "\n");
}

function getShaderName(_ref3) {
  let id = _ref3.id,
      source = _ref3.source,
      type = _ref3.type;
  const injectShaderName = id && typeof id === 'string' && source.indexOf('SHADER_NAME') === -1;
  return injectShaderName ? "\n#define SHADER_NAME ".concat(id, "_").concat(SHADER_TYPE[type], "\n\n") : '';
}

function getApplicationDefines() {
  let defines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let count = 0;
  let sourceText = '';

  for (const define in defines) {
    if (count === 0) {
      sourceText += '\n// APPLICATION DEFINES\n';
    }

    count++;
    const value = defines[define];

    if (value || Number.isFinite(value)) {
      sourceText += "#define ".concat(define.toUpperCase(), " ").concat(defines[define], "\n");
    }
  }

  if (count === 0) {
    sourceText += '\n';
  }

  return sourceText;
}
//# sourceMappingURL=assemble-shaders.js.map