import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import { Query, TransformFeedback, Buffer } from '@luma.gl/webgl';
import { getBuffersFromGeometry } from './model-utils';
import BaseModel from './base-model';
import { log, isObjectEmpty, uid, assert } from '../utils';
const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';
const LOG_DRAW_PRIORITY = 2;
export default class Model extends BaseModel {
  constructor(gl, props) {
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('model') : _props$id;
    super(gl, _objectSpread({}, props, {
      id
    }));
  }

  initialize() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super.initialize(props);
    this.drawMode = props.drawMode !== undefined ? props.drawMode : 4;
    this.vertexCount = props.vertexCount || 0;
    this.geometryBuffers = {};
    this.isInstanced = props.isInstanced || props.instanced;

    this._setModelProps(props);

    this.geometry = {};
    assert(this.drawMode !== undefined && Number.isFinite(this.vertexCount), ERR_MODEL_PARAMS);
  }

  setProps(props) {
    super.setProps(props);

    this._setModelProps(props);
  }

  delete() {
    super.delete();

    this._deleteGeometryBuffers();
  }

  destroy() {
    this.delete();
  }

  getDrawMode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  getAttributes() {
    return this.attributes;
  }

  setDrawMode(drawMode) {
    this.drawMode = drawMode;
    return this;
  }

  setVertexCount(vertexCount) {
    assert(Number.isFinite(vertexCount));
    this.vertexCount = vertexCount;
    return this;
  }

  setInstanceCount(instanceCount) {
    assert(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  setGeometry(geometry) {
    this.drawMode = geometry.drawMode;
    this.vertexCount = geometry.getVertexCount();

    this._deleteGeometryBuffers();

    this.geometryBuffers = getBuffersFromGeometry(this.gl, geometry);
    this.vertexArray.setAttributes(this.geometryBuffers);
    return this;
  }

  setAttributes() {
    let attributes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (isObjectEmpty(attributes)) {
      return this;
    }

    const normalizedAttributes = {};

    for (const name in attributes) {
      const attribute = attributes[name];
      normalizedAttributes[name] = attribute.getValue ? attribute.getValue() : attribute;
    }

    this.vertexArray.setAttributes(normalizedAttributes);
    return this;
  }

  draw() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this.drawGeometry(options);
  }

  transform() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _options$discard = options.discard,
          discard = _options$discard === void 0 ? true : _options$discard,
          feedbackBuffers = options.feedbackBuffers,
          _options$unbindModels = options.unbindModels,
          unbindModels = _options$unbindModels === void 0 ? [] : _options$unbindModels;
    let parameters = options.parameters;

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
      this.draw(Object.assign({}, options, {
        parameters
      }));
    } finally {
      unbindModels.forEach(model => model.vertexArray.bindBuffers());
    }

    return this;
  }

  render() {
    let uniforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.warn('Model.render() is deprecated. Use Model.setUniforms() and Model.draw()')();
    return this.setUniforms(uniforms).draw();
  }

  _setModelProps(props) {
    if ('instanceCount' in props) {
      this.instanceCount = props.instanceCount;
    }

    if ('geometry' in props) {
      this.setGeometry(props.geometry);
    }

    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }

    if ('_feedbackBuffers' in props) {
      this._setFeedbackBuffers(props._feedbackBuffers);
    }
  }

  _deleteGeometryBuffers() {
    for (const name in this.geometryBuffers) {
      const buffer = this.geometryBuffers[name][0] || this.geometryBuffers[name];

      if (buffer instanceof Buffer) {
        buffer.delete();
      }
    }
  }

  _setAnimationProps(animationProps) {
    if (this.animated) {
      assert(animationProps, 'Model.draw(): animated uniforms but no animationProps');

      const animatedUniforms = this._evaluateAnimateUniforms(animationProps);

      this.program.setUniforms(animatedUniforms, () => {
        this._checkForDeprecatedUniforms(animatedUniforms);
      });
    }
  }

  _setFeedbackBuffers() {
    let feedbackBuffers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (isObjectEmpty(feedbackBuffers)) {
      return this;
    }

    const gl = this.program.gl;
    this.transformFeedback = this.transformFeedback || new TransformFeedback(gl, {
      program: this.program
    });
    this.transformFeedback.setBuffers(feedbackBuffers);
    return this;
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

}
//# sourceMappingURL=model.js.map