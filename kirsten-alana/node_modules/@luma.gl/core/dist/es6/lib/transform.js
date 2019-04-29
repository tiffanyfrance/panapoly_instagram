import { combineInjects } from '@luma.gl/shadertools';
import { _transform as transform, getPassthroughFS, typeToChannelCount } from '@luma.gl/shadertools';
import { isWebGL2, Buffer, Framebuffer, Texture2D, TransformFeedback, readPixelsToArray, getShaderVersion, cloneTextureFrom } from '@luma.gl/webgl';
import { log, isObjectEmpty, assert } from '../utils';
import Model from './model';
import { updateForTextures, getSizeUniforms } from './transform-shader-utils';
const SRC_TEX_PARAMETER_OVERRIDES = {
  [10241]: 9728,
  [10240]: 9728,
  [10242]: 33071,
  [10243]: 33071
};
const FS_OUTPUT_VARIABLE = 'transform_output';
export default class Transform {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    assert(isWebGL2(gl));
    this.gl = gl;
    this.model = null;
    this.elementCount = 0;
    this.currentIndex = 0;
    this.sourceBuffers = new Array(2);
    this.sourceTextures = new Array(2);
    this.feedbackBuffers = new Array(2);
    this.targetTextures = new Array(2);
    this.transformFeedbacks = new Array(2);
    this.framebuffers = new Array(2);
    this._createdBuffers = {};
    this.elementIDBuffer = null;
    this._targetRefTexName = null;

    this._initialize(props);

    Object.seal(this);
  }

  delete() {
    for (const name in this._createdBuffers) {
      this._createdBuffers[name].delete();
    }

    this.model.delete();
  }

  getBuffer() {
    let varyingName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    const bufferOrParams = varyingName ? this.feedbackBuffers[this.currentIndex][varyingName] : null;

    if (!bufferOrParams) {
      return null;
    }

    return bufferOrParams instanceof Buffer ? bufferOrParams : bufferOrParams.buffer;
  }

  _getTargetTexture() {
    if (this.framebuffers[this.currentIndex]) {
      return this.framebuffers[this.currentIndex].attachments[36064];
    }

    return null;
  }

  getData() {
    let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$varyingName = _ref.varyingName,
        varyingName = _ref$varyingName === void 0 ? null : _ref$varyingName,
        _ref$packed = _ref.packed,
        packed = _ref$packed === void 0 ? false : _ref$packed;

    const buffer = this.getBuffer(varyingName);

    if (buffer) {
      return buffer.getData();
    }

    assert(!varyingName || varyingName === this.targetTextureVarying);
    const pixels = readPixelsToArray(this.framebuffers[this.currentIndex]);

    if (!packed) {
      return pixels;
    }

    const ArrayType = pixels.constructor;
    const channelCount = typeToChannelCount(this.targetTextureType);
    const packedPixels = new ArrayType(pixels.length * channelCount / 4);
    let packCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      for (let j = 0; j < channelCount; j++) {
        packedPixels[packCount++] = pixels[i + j];
      }
    }

    return packedPixels;
  }

  getFramebuffer() {
    return this.framebuffers[this.currentIndex];
  }

  _getInputs() {
    const uniforms = {};
    const current = this.currentIndex;
    const attributes = Object.assign({}, this.sourceBuffers[current]);

    if (this.hasSourceTextures || this.targetTextureVarying) {
      attributes.transform_elementID = this.elementIDBuffer;

      for (const sampler in this.samplerTextureMap) {
        const textureName = this.samplerTextureMap[sampler];
        uniforms[sampler] = this.sourceTextures[current][textureName];
      }

      this._setSourceTextureParameters();

      const sizeUniforms = getSizeUniforms({
        sourceTextureMap: this.sourceTextures[current],
        targetTextureVarying: this.targetTextureVarying,
        targetTexture: this.targetTextures[current]
      });
      Object.assign(uniforms, sizeUniforms);
    }

    return {
      attributes,
      uniforms
    };
  }

  run() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    const _this$_getInputs = this._getInputs(),
          attributes = _this$_getInputs.attributes,
          uniforms = _this$_getInputs.uniforms;

    Object.assign(uniforms, opts.uniforms);
    const parameters = Object.assign({}, opts.parameters);
    const _opts$clearRenderTarg = opts.clearRenderTarget,
          clearRenderTarget = _opts$clearRenderTarg === void 0 ? true : _opts$clearRenderTarg;
    let framebuffer = null;
    let discard = true;

    if (this.renderingToTexture) {
      discard = false;
      framebuffer = this.framebuffers[this.currentIndex];
      assert(framebuffer);
      parameters.viewport = [0, 0, framebuffer.width, framebuffer.height];

      if (clearRenderTarget) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      }
    }

    this.model.setAttributes(attributes);
    this.model.transform(Object.assign({}, opts, {
      transformFeedback: this.transformFeedbacks[this.currentIndex],
      uniforms,
      discard,
      framebuffer,
      parameters
    }));
  }

  swapBuffers() {
    log.deprecated('swapBuffers()', 'swap()')();
    this.swap();
  }

  swap() {
    assert(this.feedbackMap || this._swapTexture);
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  update() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (opts.elementCount) {
      this._setElementCount(opts.elementCount);
    }

    const _opts$sourceBuffers = opts.sourceBuffers,
          sourceBuffers = _opts$sourceBuffers === void 0 ? null : _opts$sourceBuffers,
          _opts$feedbackBuffers = opts.feedbackBuffers,
          feedbackBuffers = _opts$feedbackBuffers === void 0 ? null : _opts$feedbackBuffers;
    const currentIndex = this.currentIndex;

    if (sourceBuffers || feedbackBuffers) {
      for (const bufferName in feedbackBuffers) {
        assert(feedbackBuffers[bufferName] instanceof Buffer || feedbackBuffers[bufferName].buffer instanceof Buffer);
      }

      Object.assign(this.sourceBuffers[currentIndex], sourceBuffers);
      Object.assign(this.feedbackBuffers[currentIndex], feedbackBuffers);

      this._createFeedbackBuffers({
        feedbackBuffers
      });

      if (this.transformFeedbacks[currentIndex]) {
        this.transformFeedbacks[currentIndex].setBuffers(this.feedbackBuffers[currentIndex]);
      }

      this._setupSwapBuffers();
    }

    const _sourceTextures = opts._sourceTextures,
          _targetTexture = opts._targetTexture;

    if (_sourceTextures || _targetTexture) {
      Object.assign(this.sourceTextures[currentIndex], _sourceTextures);

      this._updateTargetTexture(_targetTexture || this._targetRefTexName, currentIndex);

      this._setupSwapTextures();
    }
  }

  _setSourceTextureParameters() {
    const index = this.currentIndex;

    for (const name in this.sourceTextures[index]) {
      this.sourceTextures[index][name].setParameters(SRC_TEX_PARAMETER_OVERRIDES);
    }
  }

  _setElementCount(elementCount) {
    if (this.elementCount === elementCount) {
      return;
    }

    if (this.elementCount < elementCount) {
      this._updateElementIDBuffer(elementCount);
    }

    this.model.setVertexCount(elementCount);
    this.elementCount = elementCount;
  }

  _updateTargetTexture(texture, index) {
    const targetTexture = this._buildTargetTexture(texture);

    if (targetTexture) {
      this.targetTextures[index] = targetTexture;

      if (this.framebuffers[index]) {
        this.framebuffers[index].update({
          attachments: {
            [36064]: this.targetTextures[index]
          },
          resizeAttachments: false
        });
        this.framebuffers[index].resize({
          width: targetTexture.width,
          height: targetTexture.height
        });
      }
    }
  }

  _initialize() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    const _this$_validateProps = this._validateProps(props),
          feedbackBuffers = _this$_validateProps.feedbackBuffers,
          feedbackMap = _this$_validateProps.feedbackMap;

    const sourceBuffers = props.sourceBuffers,
          varyings = props.varyings,
          _targetTexture = props._targetTexture,
          _targetTextureVarying = props._targetTextureVarying,
          _swapTexture = props._swapTexture;
    let varyingsArray = varyings;

    if (feedbackMap && !Array.isArray(varyings)) {
      varyingsArray = Object.values(feedbackMap);
    }

    this.varyingsArray = varyingsArray;
    this.feedbackMap = feedbackMap;
    this._swapTexture = _swapTexture;

    if (_targetTexture) {
      this.targetTextureVarying = _targetTextureVarying;
      this.renderingToTexture = true;
      assert(this.targetTextureVarying);
    }

    this._setupBuffers({
      sourceBuffers,
      feedbackBuffers
    });

    this._setupTextures(props);

    this._setupSwapBuffers();

    this._setupSwapTextures();

    this._buildModel(Object.assign({}, props, {
      id: props.id || 'transform-model',
      drawMode: props.drawMode || 0,
      varyings: varyingsArray
    }));
  }

  _validateProps(props) {
    let feedbackBuffers = props.feedbackBuffers,
        feedbackMap = props.feedbackMap;
    const destinationBuffers = props.destinationBuffers,
          sourceDestinationMap = props.sourceDestinationMap;

    if (destinationBuffers) {
      log.deprecated('destinationBuffers', 'feedbackBuffers')();
      feedbackBuffers = feedbackBuffers || destinationBuffers;
    }

    if (sourceDestinationMap) {
      log.deprecated('sourceDestinationMap', 'feedbackMap')();
      feedbackMap = feedbackMap || sourceDestinationMap;
    }

    const vs = props.vs,
          elementCount = props.elementCount,
          varyings = props.varyings;
    const _sourceTextures = props._sourceTextures,
          _targetTexture = props._targetTexture,
          _targetTextureVarying = props._targetTextureVarying,
          _swapTexture = props._swapTexture;
    assert(vs && (varyings || feedbackMap || _targetTexture) && elementCount);

    for (const bufferName in feedbackBuffers || {}) {
      assert(feedbackBuffers[bufferName] instanceof Buffer || feedbackBuffers[bufferName].buffer instanceof Buffer);
    }

    for (const textureName in _sourceTextures || {}) {
      assert(_sourceTextures[textureName] instanceof Texture2D);
    }

    assert(!_targetTexture || _targetTextureVarying);
    assert(!_swapTexture || _sourceTextures[_swapTexture]);
    return {
      feedbackBuffers,
      feedbackMap
    };
  }

  _setupBuffers(_ref2) {
    let _ref2$sourceBuffers = _ref2.sourceBuffers,
        sourceBuffers = _ref2$sourceBuffers === void 0 ? null : _ref2$sourceBuffers,
        _ref2$feedbackBuffers = _ref2.feedbackBuffers,
        feedbackBuffers = _ref2$feedbackBuffers === void 0 ? null : _ref2$feedbackBuffers;
    this.sourceBuffers[0] = Object.assign({}, sourceBuffers);
    this.feedbackBuffers[0] = Object.assign({}, feedbackBuffers);

    this._createFeedbackBuffers({
      feedbackBuffers
    });

    this.sourceBuffers[1] = {};
    this.feedbackBuffers[1] = {};
  }

  _setupTextures() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _sourceTextures = props._sourceTextures,
          _targetTexture = props._targetTexture;
    this.sourceTextures[0] = Object.assign({}, _sourceTextures);
    this.sourceTextures[1] = {};
    this.hasSourceTextures = Object.keys(this.sourceTextures[0]).length > 0;

    if (this.targetTextureVarying) {
      const texture = this._buildTargetTexture(_targetTexture);

      assert(texture);
      this.targetTextures[0] = texture;
      this.targetTextures[1] = null;
    }
  }

  _buildTargetTexture(textureOrAttribute) {
    if (textureOrAttribute instanceof Texture2D) {
      return textureOrAttribute;
    }

    const refTexture = this.sourceTextures[0][textureOrAttribute];

    if (!refTexture) {
      return null;
    }

    this._targetRefTexName = textureOrAttribute;
    return cloneTextureFrom(refTexture, {
      parameters: {
        [10241]: 9728,
        [10240]: 9728,
        [10242]: 33071,
        [10243]: 33071
      },
      pixelStore: {
        [37440]: false
      }
    });
  }

  _createFeedbackBuffers(_ref3) {
    let feedbackBuffers = _ref3.feedbackBuffers;

    if (!this.feedbackMap) {
      return;
    }

    const current = this.currentIndex;

    for (const sourceBufferName in this.feedbackMap) {
      const feedbackBufferName = this.feedbackMap[sourceBufferName];

      if (feedbackBufferName !== this.targetTextureVarying && (!feedbackBuffers || !feedbackBuffers[feedbackBufferName])) {
        const sourceBuffer = this.sourceBuffers[current][sourceBufferName];
        const byteLength = sourceBuffer.byteLength,
              usage = sourceBuffer.usage,
              accessor = sourceBuffer.accessor;
        const buffer = new Buffer(this.gl, {
          byteLength,
          usage,
          accessor
        });

        if (this._createdBuffers[feedbackBufferName]) {
          this._createdBuffers[feedbackBufferName].delete();
        }

        this._createdBuffers[feedbackBufferName] = buffer;
        this.feedbackBuffers[current][feedbackBufferName] = buffer;
      }
    }
  }

  _createNewBuffer(name, opts) {
    const buffer = new Buffer(this.gl, opts);

    if (this._createdBuffers[name]) {
      this._createdBuffers[name].delete();

      this._createdBuffers[name] = buffer;
    }

    return buffer;
  }

  _setupSwapBuffers() {
    if (!this.feedbackMap) {
      return;
    }

    const current = this.currentIndex;
    const next = (current + 1) % 2;
    Object.assign(this.sourceBuffers[next], this.sourceBuffers[current]);
    Object.assign(this.feedbackBuffers[next], this.feedbackBuffers[current]);

    for (const srcName in this.feedbackMap) {
      const dstName = this.feedbackMap[srcName];

      if (dstName !== this.targetTextureVarying) {
        this.sourceBuffers[next][srcName] = this.feedbackBuffers[current][dstName];
        this.feedbackBuffers[next][dstName] = this.sourceBuffers[current][srcName];
        assert(this.feedbackBuffers[next][dstName] instanceof Buffer);
      }
    }

    if (this.transformFeedbacks[next]) {
      this.transformFeedbacks[next].setBuffers(this.feedbackBuffers[next]);
    }
  }

  _setupSwapTextures() {
    if (!this._swapTexture || !this.targetTextureVarying) {
      return;
    }

    const current = this.currentIndex;
    const next = (current + 1) % 2;
    Object.assign(this.sourceTextures[next], this.sourceTextures[current]);
    this.sourceTextures[next][this._swapTexture] = this.targetTextures[current];

    this._updateTargetTexture(this.sourceTextures[current][this._swapTexture], next);
  }

  _buildModel() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    const _this$_getShaders = this._getShaders(props),
          vs = _this$_getShaders.vs,
          fs = _this$_getShaders.fs,
          modules = _this$_getShaders.modules,
          uniforms = _this$_getShaders.uniforms,
          inject = _this$_getShaders.inject,
          samplerTextureMap = _this$_getShaders.samplerTextureMap;

    this.model = new Model(this.gl, Object.assign({}, props, {
      vs,
      fs,
      vertexCount: props.elementCount,
      modules,
      uniforms,
      inject
    }));
    this.samplerTextureMap = samplerTextureMap;

    this._setupTransformFeedback();

    this._setupFramebuffers();

    this._setElementCount(props.elementCount);
  }

  _setupTransformFeedback() {
    if (isObjectEmpty(this.feedbackBuffers[0])) {
      return;
    }

    this.transformFeedbacks[0] = new TransformFeedback(this.gl, {
      program: this.model.program,
      buffers: this.feedbackBuffers[0]
    });

    if (this.feedbackMap) {
      this.transformFeedbacks[1] = new TransformFeedback(this.gl, {
        program: this.model.program,
        buffers: this.feedbackBuffers[1]
      });
    }
  }

  _setupFramebuffers() {
    if (!this.renderingToTexture) {
      return;
    }

    let _this$targetTextures$ = this.targetTextures[0],
        width = _this$targetTextures$.width,
        height = _this$targetTextures$.height;
    this.framebuffers[0] = new Framebuffer(this.gl, {
      id: "".concat(this.id || 'transform', "-framebuffer-0"),
      width,
      height,
      attachments: {
        [36064]: this.targetTextures[0]
      }
    });

    if (this._swapTexture) {
      var _this$targetTextures$2 = this.targetTextures[1];
      width = _this$targetTextures$2.width;
      height = _this$targetTextures$2.height;
      this.framebuffers[1] = new Framebuffer(this.gl, {
        id: "".concat(this.id || 'transform', "-framebuffer-1"),
        width,
        height,
        attachments: {
          [36064]: this.targetTextures[1]
        }
      });
    }
  }

  _updateElementIDBuffer(elementCount) {
    if (!this.hasSourceTextures && !this.targetTextureVarying) {
      return;
    }

    const elementIds = new Float32Array(elementCount);
    elementIds.forEach((_, index, array) => {
      array[index] = index;
    });

    if (!this.elementIDBuffer) {
      this.elementIDBuffer = new Buffer(this.gl, {
        data: elementIds,
        size: 1
      });
    } else {
      this.elementIDBuffer.setData({
        data: elementIds
      });
    }
  }

  _getShaders() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    const _this$_processVertexS = this._processVertexShader(props.vs),
          vs = _this$_processVertexS.vs,
          uniforms = _this$_processVertexS.uniforms,
          targetTextureType = _this$_processVertexS.targetTextureType,
          inject = _this$_processVertexS.inject,
          samplerTextureMap = _this$_processVertexS.samplerTextureMap;

    const combinedInject = combineInjects([props.inject || {}, inject]);
    this.targetTextureType = targetTextureType;
    const fs = getPassthroughFS({
      version: getShaderVersion(vs),
      input: this.targetTextureVarying,
      inputType: targetTextureType,
      output: FS_OUTPUT_VARIABLE
    });
    const modules = this.hasSourceTextures || this.targetTextureVarying ? [transform].concat(props.modules || []) : props.modules;
    return {
      vs,
      fs,
      modules,
      uniforms,
      inject: combinedInject,
      samplerTextureMap
    };
  }

  _processVertexShader(vs) {
    return updateForTextures({
      vs,
      sourceTextureMap: this.sourceTextures[this.currentIndex],
      targetTextureVarying: this.targetTextureVarying,
      targetTexture: this.targetTextures[this.currentIndex]
    });
  }

}
//# sourceMappingURL=transform.js.map