import { isWebGL, Query, Program, VertexArray, clear } from '@luma.gl/webgl';
import { MODULAR_SHADERS, assembleShaders } from '@luma.gl/shadertools';
import { getDebugTableForUniforms, getDebugTableForVertexArray, getDebugTableForProgramConfiguration } from '@luma.gl/webgl';
import { addModel, removeModel, logModel, getOverrides } from '../debug/seer-integration';
import { log, isObjectEmpty, uid, assert } from '../utils';
const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;
const DEPRECATED_PICKING_UNIFORMS = ['renderPickingBuffer', 'pickingEnabled'];
export default class BaseModel {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    assert(isWebGL(gl));
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('base-model') : _props$id;
    this.id = id;
    this.gl = gl;
    this.id = props.id || uid('Model');
    this.lastLogTime = 0;
    this.initialize(props);

    this._setBaseModelProps(props);
  }

  initialize() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.props = {};
    this.program = this._createProgram(props);
    this.vertexArray = new VertexArray(this.gl, {
      program: this.program
    });
    this.userData = {};
    this.needsRedraw = true;
    this._attributes = {};
    this.attributes = {};
    this.animatedUniforms = {};
    this.animated = false;
    this.animationLoop = null;
    this.timerQueryEnabled = false;
    this.timeElapsedQuery = undefined;
    this.lastQueryReturned = true;
    this.stats = {
      accumulatedFrameTime: 0,
      averageFrameTime: 0,
      profileFrameCount: 0
    };
    this.pickable = true;

    this._setBaseModelProps(props);

    this.setUniforms(Object.assign({}, this.getModuleUniforms(), this.getModuleUniforms(props.moduleSettings)));
  }

  setProps(props) {
    this._setBaseModelProps(props);
  }

  delete() {
    for (const key in this._attributes) {
      if (this._attributes[key] !== this.attributes[key]) {
        this._attributes[key].delete();
      }
    }

    this.program.delete();
    this.vertexArray.delete();
    removeModel(this.id);
  }

  destroy() {
    this.delete();
  }

  isAnimated() {
    return this.animated;
  }

  getProgram() {
    return this.program;
  }

  getUniforms() {
    return this.program.getUniforms();
  }

  setUniforms() {
    let uniforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    uniforms = Object.assign({}, uniforms);
    getOverrides(this.id, uniforms);
    uniforms = this._extractAnimatedUniforms(uniforms);
    this.program.setUniforms(uniforms, () => {
      this._checkForDeprecatedUniforms(uniforms);
    });
    return this;
  }

  updateModuleSettings(opts) {
    const uniforms = this.getModuleUniforms(opts || {});
    return this.setUniforms(uniforms);
  }

  clear(opts) {
    clear(this.program.gl, opts);
    return this;
  }

  drawGeometry() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _opts$moduleSettings = opts.moduleSettings,
          moduleSettings = _opts$moduleSettings === void 0 ? null : _opts$moduleSettings,
          framebuffer = opts.framebuffer,
          _opts$uniforms = opts.uniforms,
          uniforms = _opts$uniforms === void 0 ? {} : _opts$uniforms,
          _opts$attributes = opts.attributes,
          attributes = _opts$attributes === void 0 ? {} : _opts$attributes,
          _opts$transformFeedba = opts.transformFeedback,
          transformFeedback = _opts$transformFeedba === void 0 ? this.transformFeedback : _opts$transformFeedba,
          _opts$parameters = opts.parameters,
          parameters = _opts$parameters === void 0 ? {} : _opts$parameters,
          _opts$vertexArray = opts.vertexArray,
          vertexArray = _opts$vertexArray === void 0 ? this.vertexArray : _opts$vertexArray,
          animationProps = opts.animationProps;
    addModel(this);
    this.setAttributes(attributes);
    this.updateModuleSettings(moduleSettings);
    this.setUniforms(uniforms);

    this._refreshAnimationProps(animationProps);

    const logPriority = this._logDrawCallStart(2);

    const drawParams = this.vertexArray.getDrawParams(this.props);

    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const isIndexed = drawParams.isIndexed,
          indexType = drawParams.indexType,
          indexOffset = drawParams.indexOffset;
    const isInstanced = this.isInstanced,
          instanceCount = this.instanceCount;

    const noop = () => {};

    const _this$props = this.props,
          _this$props$onBeforeR = _this$props.onBeforeRender,
          onBeforeRender = _this$props$onBeforeR === void 0 ? noop : _this$props$onBeforeR,
          _this$props$onAfterRe = _this$props.onAfterRender,
          onAfterRender = _this$props$onAfterRe === void 0 ? noop : _this$props$onAfterRe;
    onBeforeRender();

    this._timerQueryStart();

    const didDraw = this.program.draw(Object.assign({}, opts, {
      logPriority,
      uniforms: null,
      framebuffer,
      parameters,
      drawMode: this.getDrawMode(),
      vertexCount: this.getVertexCount(),
      vertexArray,
      transformFeedback,
      isIndexed,
      indexType,
      isInstanced,
      instanceCount,
      offset: isIndexed ? indexOffset : 0
    }));

    this._timerQueryEnd();

    onAfterRender();

    this._logDrawCallEnd(logPriority, vertexArray, framebuffer);

    return didDraw;
  }

  transform() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _opts$discard = opts.discard,
          discard = _opts$discard === void 0 ? true : _opts$discard,
          feedbackBuffers = opts.feedbackBuffers,
          _opts$unbindModels = opts.unbindModels,
          unbindModels = _opts$unbindModels === void 0 ? [] : _opts$unbindModels;
    let parameters = opts.parameters;

    if (feedbackBuffers) {
      this._setFeedbackBuffers(feedbackBuffers);
    }

    if (discard) {
      parameters = Object.assign({}, parameters, {
        [35977]: discard
      });
    }

    unbindModels.forEach(model => model.vertexArray.unbindBuffers());

    try {
      this.draw(Object.assign({}, opts, {
        parameters
      }));
    } finally {
      unbindModels.forEach(model => model.vertexArray.bindBuffers());
    }

    return this;
  }

  _setBaseModelProps(props) {
    Object.assign(this.props, props);

    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }

    if ('pickable' in props) {
      this.pickable = props.pickable;
    }

    if ('timerQueryEnabled' in props) {
      this.timerQueryEnabled = props.timerQueryEnabled && Query.isSupported(this.gl, ['timers']);

      if (props.timerQueryEnabled && !this.timerQueryEnabled) {
        log.warn('GPU timer not supported')();
      }
    }

    if ('_animationProps' in props) {
      this._setAnimationProps(props._animationProps);
    }

    if ('_animationLoop' in props) {
      this.animationLoop = props._animationLoop;
    }
  }

  _createProgram(_ref) {
    let _ref$vs = _ref.vs,
        vs = _ref$vs === void 0 ? null : _ref$vs,
        _ref$fs = _ref.fs,
        fs = _ref$fs === void 0 ? null : _ref$fs,
        _ref$modules = _ref.modules,
        modules = _ref$modules === void 0 ? null : _ref$modules,
        _ref$defines = _ref.defines,
        defines = _ref$defines === void 0 ? {} : _ref$defines,
        _ref$inject = _ref.inject,
        inject = _ref$inject === void 0 ? {} : _ref$inject,
        _ref$shaderCache = _ref.shaderCache,
        shaderCache = _ref$shaderCache === void 0 ? null : _ref$shaderCache,
        _ref$varyings = _ref.varyings,
        varyings = _ref$varyings === void 0 ? null : _ref$varyings,
        _ref$bufferMode = _ref.bufferMode,
        bufferMode = _ref$bufferMode === void 0 ? 35981 : _ref$bufferMode,
        _ref$program = _ref.program,
        program = _ref$program === void 0 ? null : _ref$program;

    this.getModuleUniforms = x => {};

    const id = this.id;

    if (!program) {
      vs = vs || MODULAR_SHADERS.vs;
      fs = fs || MODULAR_SHADERS.fs;
      const assembleResult = assembleShaders(this.gl, {
        vs,
        fs,
        modules,
        inject,
        defines,
        log
      });
      vs = assembleResult.vs;
      fs = assembleResult.fs;

      if (shaderCache) {
        program = shaderCache.getProgram(this.gl, {
          id,
          vs,
          fs
        });
      } else {
        program = new Program(this.gl, {
          id,
          vs,
          fs,
          varyings,
          bufferMode
        });
      }

      this.getModuleUniforms = assembleResult.getUniforms || (x => {});
    }

    assert(program instanceof Program, 'Model needs a program');
    return program;
  }

  _checkForDeprecatedUniforms(uniforms) {
    DEPRECATED_PICKING_UNIFORMS.forEach(uniform => {
      if (uniform in uniforms) {
        log.deprecated(uniform, 'use picking shader module and Model class updateModuleSettings()')();
      }
    });
  }

  _refreshAnimationProps(animationProps) {
    animationProps = animationProps || this.animationLoop && this.animationLoop.animationProps;

    if (animationProps) {
      this._setAnimationProps(animationProps);
    }
  }

  _evaluateAnimateUniforms(animationProps) {
    if (!this.animated) {
      return {};
    }

    const animatedUniforms = {};

    for (const uniformName in this.animatedUniforms) {
      const valueFunction = this.animatedUniforms[uniformName];
      animatedUniforms[uniformName] = valueFunction(animationProps);
    }

    return animatedUniforms;
  }

  _extractAnimatedUniforms(uniforms) {
    let foundAnimated = false;

    for (const uniformName in uniforms) {
      const newValue = uniforms[uniformName];

      if (typeof newValue === 'function') {
        this.animatedUniforms[uniformName] = newValue;
        foundAnimated = true;
      } else {
        delete this.animatedUniforms[uniformName];
      }
    }

    this.animated = !isObjectEmpty(this.animatedUniforms);

    if (!foundAnimated) {
      return uniforms;
    }

    const staticUniforms = {};

    for (const uniformName in uniforms) {
      if (!this.animatedUniforms[uniformName]) {
        staticUniforms[uniformName] = uniforms[uniformName];
      }
    }

    return staticUniforms;
  }

  _timerQueryStart() {
    if (this.timerQueryEnabled === true) {
      if (!this.timeElapsedQuery) {
        this.timeElapsedQuery = new Query(this.gl);
      }

      if (this.lastQueryReturned) {
        this.lastQueryReturned = false;
        this.timeElapsedQuery.beginTimeElapsedQuery();
      }
    }
  }

  _timerQueryEnd() {
    if (this.timerQueryEnabled === true) {
      this.timeElapsedQuery.end();

      if (this.timeElapsedQuery.isResultAvailable()) {
        this.lastQueryReturned = true;
        const elapsedTime = this.timeElapsedQuery.getTimerMilliseconds();
        this.stats.lastFrameTime = elapsedTime;
        this.stats.accumulatedFrameTime += elapsedTime;
        this.stats.profileFrameCount++;
        this.stats.averageFrameTime = this.stats.accumulatedFrameTime / this.stats.profileFrameCount;
        log.log(LOG_DRAW_PRIORITY, "GPU time ".concat(this.program.id, ": ").concat(this.stats.lastFrameTime, "ms average ").concat(this.stats.averageFrameTime, "ms accumulated: ").concat(this.stats.accumulatedFrameTime, "ms count: ").concat(this.stats.profileFrameCount))();
      }
    }
  }

  _logDrawCallStart(priority) {
    const logDrawTimeout = priority > 3 ? 0 : LOG_DRAW_TIMEOUT;

    if (log.priority < priority || Date.now() - this.lastLogTime < logDrawTimeout) {
      return undefined;
    }

    this.lastLogTime = Date.now();
    log.group(LOG_DRAW_PRIORITY, ">>> DRAWING MODEL ".concat(this.id), {
      collapsed: log.priority <= 2
    })();
    return priority;
  }

  _logDrawCallEnd(priority, vertexArray, uniforms, framebuffer) {
    if (priority === undefined) {
      return;
    }

    const attributeTable = getDebugTableForVertexArray({
      vertexArray,
      header: "".concat(this.id, " attributes"),
      attributes: this._attributes
    });

    const _getDebugTableForUnif = getDebugTableForUniforms({
      header: "".concat(this.id, " uniforms"),
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms)
    }),
          uniformTable = _getDebugTableForUnif.table,
          unusedTable = _getDebugTableForUnif.unusedTable,
          unusedCount = _getDebugTableForUnif.unusedCount;

    const _getDebugTableForUnif2 = getDebugTableForUniforms({
      header: "".concat(this.id, " uniforms"),
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms),
      undefinedOnly: true
    }),
          missingTable = _getDebugTableForUnif2.table,
          missingCount = _getDebugTableForUnif2.count;

    if (missingCount > 0) {
      log.log('MISSING UNIFORMS', Object.keys(missingTable))();
    }

    if (unusedCount > 0) {
      log.log('UNUSED UNIFORMS', Object.keys(unusedTable))();
    }

    const configTable = getDebugTableForProgramConfiguration(this.vertexArray.configuration);
    log.table(priority, attributeTable)();
    log.table(priority, uniformTable)();
    log.table(priority + 1, configTable)();
    logModel(this, uniforms);

    if (framebuffer) {
      framebuffer.log({
        priority: LOG_DRAW_PRIORITY,
        message: "Rendered to ".concat(framebuffer.id)
      });
    }

    log.groupEnd(LOG_DRAW_PRIORITY, ">>> DRAWING MODEL ".concat(this.id))();
  }

}
//# sourceMappingURL=base-model.js.map