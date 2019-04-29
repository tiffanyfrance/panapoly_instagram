import Resource from './resource';
import RENDERBUFFER_FORMATS from './renderbuffer-formats';
import { isWebGL2 } from '../webgl-utils';
import { assert } from '../utils';

function isFormatSupported(gl, format, formats) {
  const info = formats[format];

  if (!info) {
    return false;
  }

  const value = isWebGL2(gl) ? info.gl2 || info.gl1 : info.gl1;

  if (typeof value === 'string') {
    return gl.getExtension(value);
  }

  return value;
}

export default class Renderbuffer extends Resource {
  static isSupported(gl) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        format = _ref.format;

    return !format || isFormatSupported(gl, format, RENDERBUFFER_FORMATS);
  }

  static getSamplesForFormat(gl, _ref2) {
    let format = _ref2.format;
    return gl.getInternalformatParameter(36161, format, 32937);
  }

  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, opts);
    this.initialize(opts);
    Object.seal(this);
  }

  initialize(_ref3) {
    let format = _ref3.format,
        _ref3$width = _ref3.width,
        width = _ref3$width === void 0 ? 1 : _ref3$width,
        _ref3$height = _ref3.height,
        height = _ref3$height === void 0 ? 1 : _ref3$height,
        _ref3$samples = _ref3.samples,
        samples = _ref3$samples === void 0 ? 0 : _ref3$samples;
    assert(format, 'Needs format');

    this._trackDeallocatedMemory();

    this.gl.bindRenderbuffer(36161, this.handle);

    if (samples !== 0 && isWebGL2(this.gl)) {
      this.gl.renderbufferStorageMultisample(36161, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(36161, format, width, height);
    }

    this.format = format;
    this.width = width;
    this.height = height;
    this.samples = samples;

    this._trackAllocatedMemory(this.width * this.height * (this.samples || 1) * RENDERBUFFER_FORMATS[this.format].bpp);

    return this;
  }

  resize(_ref4) {
    let width = _ref4.width,
        height = _ref4.height;

    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        samples: this.samples
      });
    }

    return this;
  }

  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);

    this._trackDeallocatedMemory();
  }

  _bindHandle(handle) {
    this.gl.bindRenderbuffer(36161, handle);
  }

  _syncHandle(handle) {
    this.format = this.getParameter(36164);
    this.width = this.getParameter(36162);
    this.height = this.getParameter(36163);
    this.samples = this.getParameter(36011);
  }

  _getParameter(pname) {
    this.gl.bindRenderbuffer(36161, this.handle);
    const value = this.gl.getRenderbufferParameter(36161, pname);
    return value;
  }

}
//# sourceMappingURL=renderbuffer.js.map