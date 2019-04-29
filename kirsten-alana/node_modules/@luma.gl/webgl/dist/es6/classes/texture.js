import Resource from './resource';
import Buffer from './buffer';
import { TEXTURE_FORMATS, DATA_FORMAT_CHANNELS, TYPE_SIZES, isFormatSupported, isLinearFilteringSupported } from './texture-formats';
import { withParameters } from '../context';
import { isWebGL2, assertWebGL2Context, WebGLBuffer } from '../webgl-utils';
import { log, uid, isPowerOfTwo, assert } from '../utils';
const NPOT_MIN_FILTERS = [9729, 9728];
export default class Texture extends Resource {
  static isSupported(gl) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        format = _ref.format,
        linearFiltering = _ref.linearFiltering;

    let supported = true;

    if (format) {
      supported = supported && isFormatSupported(gl, format);
      supported = supported && (!linearFiltering || isLinearFilteringSupported(gl, format));
    }

    return supported;
  }

  constructor(gl, props) {
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('texture') : _props$id,
          handle = props.handle,
          target = props.target;
    super(gl, {
      id,
      handle
    });
    this.target = target;
    this.hasFloatTexture = gl.getExtension('OES_texture_float');
    this.textureUnit = undefined;
    this.loaded = false;
    this.width = undefined;
    this.height = undefined;
    this.depth = undefined;
    this.format = undefined;
    this.type = undefined;
    this.dataFormat = undefined;
    this.border = undefined;
    this.textureUnit = undefined;
    this.mipmaps = undefined;
  }

  toString() {
    return "Texture(".concat(this.id, ",").concat(this.width, "x").concat(this.height, ")");
  }

  initialize() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let data = props.data;

    if (data instanceof Promise) {
      data.then(resolvedImageData => this.initialize(Object.assign({}, props, {
        pixels: resolvedImageData,
        data: resolvedImageData
      })));
      return this;
    }

    const _props$pixels = props.pixels,
          pixels = _props$pixels === void 0 ? null : _props$pixels,
          _props$format = props.format,
          format = _props$format === void 0 ? 6408 : _props$format,
          _props$type = props.type,
          type = _props$type === void 0 ? 5121 : _props$type,
          _props$border = props.border,
          border = _props$border === void 0 ? 0 : _props$border,
          _props$recreate = props.recreate,
          recreate = _props$recreate === void 0 ? false : _props$recreate,
          _props$parameters = props.parameters,
          parameters = _props$parameters === void 0 ? {} : _props$parameters,
          _props$pixelStore = props.pixelStore,
          pixelStore = _props$pixelStore === void 0 ? {} : _props$pixelStore,
          _props$textureUnit = props.textureUnit,
          textureUnit = _props$textureUnit === void 0 ? undefined : _props$textureUnit,
          _props$unpackFlipY = props.unpackFlipY,
          unpackFlipY = _props$unpackFlipY === void 0 ? true : _props$unpackFlipY;
    let _props$mipmaps = props.mipmaps,
        mipmaps = _props$mipmaps === void 0 ? true : _props$mipmaps;

    if (!data) {
      data = pixels;
    }

    let width = props.width,
        height = props.height,
        dataFormat = props.dataFormat;
    const _props$depth = props.depth,
          depth = _props$depth === void 0 ? 0 : _props$depth;

    var _this$_deduceParamete = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed: false,
      data,
      width,
      height
    });

    width = _this$_deduceParamete.width;
    height = _this$_deduceParamete.height;
    dataFormat = _this$_deduceParamete.dataFormat;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.format = format;
    this.type = type;
    this.dataFormat = dataFormat;
    this.border = border;
    this.textureUnit = textureUnit;

    if (Number.isFinite(this.textureUnit)) {
      this.gl.activeTexture(33984 + this.textureUnit);
      this.gl.bindTexture(this.target, this.handle);
    }

    const DEFAULT_TEXTURE_SETTINGS = {
      [37440]: unpackFlipY
    };
    const glSettings = Object.assign({}, DEFAULT_TEXTURE_SETTINGS, pixelStore);

    if (mipmaps && this._isNPOT()) {
      log.warn("texture: ".concat(this, " is Non-Power-Of-Two, disabling mipmaping"))();
      mipmaps = false;

      this._updateForNPOT(parameters);
    }

    this.mipmaps = mipmaps;
    this.setImageData({
      data,
      width,
      height,
      depth,
      format,
      type,
      dataFormat,
      border,
      mipmaps,
      parameters: glSettings
    });

    if (mipmaps) {
      this.generateMipmap();
    }

    this.setParameters(parameters);

    if (recreate) {
      this.data = data;
    }

    return this;
  }

  resize(_ref2) {
    let width = _ref2.width,
        height = _ref2.height;

    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        type: this.type,
        dataFormat: this.dataFormat,
        border: this.border,
        mipmaps: false
      });
    }

    return this;
  }

  generateMipmap() {
    let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, params, () => {
      this.gl.generateMipmap(this.target);
    });
    this.gl.bindTexture(this.target, null);
    return this;
  }

  setImageData(options) {
    this._trackDeallocatedMemory('Texture');

    const _options$target = options.target,
          target = _options$target === void 0 ? this.target : _options$target,
          _options$pixels = options.pixels,
          pixels = _options$pixels === void 0 ? null : _options$pixels,
          _options$level = options.level,
          level = _options$level === void 0 ? 0 : _options$level,
          _options$format = options.format,
          format = _options$format === void 0 ? this.format : _options$format,
          _options$border = options.border,
          border = _options$border === void 0 ? this.border : _options$border,
          _options$offset = options.offset,
          offset = _options$offset === void 0 ? 0 : _options$offset,
          _options$parameters = options.parameters,
          parameters = _options$parameters === void 0 ? {} : _options$parameters;
    let _options$data = options.data,
        data = _options$data === void 0 ? null : _options$data,
        _options$type = options.type,
        type = _options$type === void 0 ? this.type : _options$type,
        _options$width = options.width,
        width = _options$width === void 0 ? this.width : _options$width,
        _options$height = options.height,
        height = _options$height === void 0 ? this.height : _options$height,
        _options$dataFormat = options.dataFormat,
        dataFormat = _options$dataFormat === void 0 ? this.dataFormat : _options$dataFormat,
        _options$compressed = options.compressed,
        compressed = _options$compressed === void 0 ? false : _options$compressed;

    if (!data) {
      data = pixels;
    }

    var _this$_deduceParamete2 = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    });

    type = _this$_deduceParamete2.type;
    dataFormat = _this$_deduceParamete2.dataFormat;
    compressed = _this$_deduceParamete2.compressed;
    width = _this$_deduceParamete2.width;
    height = _this$_deduceParamete2.height;
    const gl = this.gl;
    gl.bindTexture(this.target, this.handle);
    let dataType = null;

    var _this$_getDataType = this._getDataType({
      data,
      compressed
    });

    data = _this$_getDataType.data;
    dataType = _this$_getDataType.dataType;
    withParameters(this.gl, parameters, () => {
      switch (dataType) {
        case 'null':
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          break;

        case 'typed-array':
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data, offset);
          break;

        case 'buffer':
          assertWebGL2Context(gl);
          gl.bindBuffer(35052, data.handle || data);
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, offset);
          gl.bindBuffer(35052, null);
          break;

        case 'browser-object':
          if (isWebGL2(gl)) {
            gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          } else {
            gl.texImage2D(target, level, format, dataFormat, type, data);
          }

          break;

        case 'compressed':
          gl.compressedTexImage2D(target, level, format, width, height, border, data);
          break;

        default:
          assert(false, 'Unknown image data type');
      }
    });

    if (data && data.byteLength) {
      this._trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this._trackAllocatedMemory(this.width * this.height * channels * channelSize, 'Texture');
    }

    this.loaded = true;
    return this;
  }

  setSubImageData(_ref3) {
    let _ref3$target = _ref3.target,
        target = _ref3$target === void 0 ? this.target : _ref3$target,
        _ref3$pixels = _ref3.pixels,
        pixels = _ref3$pixels === void 0 ? null : _ref3$pixels,
        _ref3$data = _ref3.data,
        data = _ref3$data === void 0 ? null : _ref3$data,
        _ref3$x = _ref3.x,
        x = _ref3$x === void 0 ? 0 : _ref3$x,
        _ref3$y = _ref3.y,
        y = _ref3$y === void 0 ? 0 : _ref3$y,
        _ref3$width = _ref3.width,
        width = _ref3$width === void 0 ? this.width : _ref3$width,
        _ref3$height = _ref3.height,
        height = _ref3$height === void 0 ? this.height : _ref3$height,
        _ref3$level = _ref3.level,
        level = _ref3$level === void 0 ? 0 : _ref3$level,
        _ref3$format = _ref3.format,
        format = _ref3$format === void 0 ? this.format : _ref3$format,
        _ref3$type = _ref3.type,
        type = _ref3$type === void 0 ? this.type : _ref3$type,
        _ref3$dataFormat = _ref3.dataFormat,
        dataFormat = _ref3$dataFormat === void 0 ? this.dataFormat : _ref3$dataFormat,
        _ref3$compressed = _ref3.compressed,
        compressed = _ref3$compressed === void 0 ? false : _ref3$compressed,
        _ref3$offset = _ref3.offset,
        offset = _ref3$offset === void 0 ? 0 : _ref3$offset,
        _ref3$border = _ref3.border,
        border = _ref3$border === void 0 ? this.border : _ref3$border,
        _ref3$parameters = _ref3.parameters,
        parameters = _ref3$parameters === void 0 ? {} : _ref3$parameters;

    var _this$_deduceParamete3 = this._deduceParameters({
      format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    });

    type = _this$_deduceParamete3.type;
    dataFormat = _this$_deduceParamete3.dataFormat;
    compressed = _this$_deduceParamete3.compressed;
    width = _this$_deduceParamete3.width;
    height = _this$_deduceParamete3.height;
    assert(this.depth === 0, 'texSubImage not supported for 3D textures');

    if (!data) {
      data = pixels;
    }

    if (data && data.data) {
      const ndarray = data;
      data = ndarray.data;
      width = ndarray.shape[0];
      height = ndarray.shape[1];
    }

    if (data instanceof Buffer) {
      data = data.handle;
    }

    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, parameters, () => {
      if (compressed) {
        this.gl.compressedTexSubImage2D(target, level, x, y, width, height, format, data);
      } else if (data === null) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, null);
      } else if (ArrayBuffer.isView(data)) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data, offset);
      } else if (data instanceof WebGLBuffer) {
        assertWebGL2Context(this.gl);
        this.gl.bindBuffer(35052, data);
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, offset);
        this.gl.bindBuffer(35052, null);
      } else if (isWebGL2(this.gl)) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data);
      } else {
        this.gl.texSubImage2D(target, level, x, y, dataFormat, type, data);
      }
    });
    this.gl.bindTexture(this.target, null);
  }

  copyFramebuffer() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Texture.copyFramebuffer({...}) is no logner supported, use copyToTexture(source, target, opts})')();
    return null;
  }

  getActiveUnit() {
    return this.gl.getParameter(34016) - 33984;
  }

  bind() {
    let textureUnit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.textureUnit;
    const gl = this.gl;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(33984 + textureUnit);
    }

    gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind() {
    let textureUnit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.textureUnit;
    const gl = this.gl;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(33984 + textureUnit);
    }

    gl.bindTexture(this.target, null);
    return textureUnit;
  }

  _getDataType(_ref4) {
    let data = _ref4.data,
        _ref4$compressed = _ref4.compressed,
        compressed = _ref4$compressed === void 0 ? false : _ref4$compressed;

    if (compressed) {
      return {
        data,
        dataType: 'compressed'
      };
    }

    if (data === null) {
      return {
        data,
        dataType: 'null'
      };
    }

    if (ArrayBuffer.isView(data)) {
      return {
        data,
        dataType: 'typed-array'
      };
    }

    if (data instanceof Buffer) {
      return {
        data: data.handle,
        dataType: 'buffer'
      };
    }

    if (data instanceof WebGLBuffer) {
      return {
        data,
        dataType: 'buffer'
      };
    }

    return {
      data,
      dataType: 'browser-object'
    };
  }

  _deduceParameters(opts) {
    const format = opts.format,
          data = opts.data;
    let width = opts.width,
        height = opts.height,
        dataFormat = opts.dataFormat,
        type = opts.type,
        compressed = opts.compressed;
    const textureFormat = TEXTURE_FORMATS[format];
    dataFormat = dataFormat || textureFormat && textureFormat.dataFormat;
    type = type || textureFormat && textureFormat.types[0];
    compressed = compressed || textureFormat && textureFormat.compressed;

    var _this$_deduceImageSiz = this._deduceImageSize(data, width, height);

    width = _this$_deduceImageSiz.width;
    height = _this$_deduceImageSiz.height;
    return {
      dataFormat,
      type,
      compressed,
      width,
      height,
      format,
      data
    };
  }

  _deduceImageSize(data, width, height) {
    let size;

    if (typeof ImageData !== 'undefined' && data instanceof ImageData) {
      size = {
        width: data.width,
        height: data.height
      };
    } else if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
      size = {
        width: data.naturalWidth,
        height: data.naturalHeight
      };
    } else if (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) {
      size = {
        width: data.width,
        height: data.height
      };
    } else if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
      size = {
        width: data.videoWidth,
        height: data.videoHeight
      };
    } else if (!data) {
      size = {
        width: width >= 0 ? width : 1,
        height: height >= 0 ? height : 1
      };
    } else {
      size = {
        width,
        height
      };
    }

    assert(size, 'Could not deduced texture size');
    assert(width === undefined || size.width === width, 'Deduced texture width does not match supplied width');
    assert(height === undefined || size.height === height, 'Deduced texture height does not match supplied height');
    return size;
  }

  _createHandle() {
    return this.gl.createTexture();
  }

  _deleteHandle() {
    this.gl.deleteTexture(this.handle);

    this._trackDeallocatedMemory('Texture');
  }

  _getParameter(pname) {
    switch (pname) {
      case 4096:
        return this.width;

      case 4097:
        return this.height;

      default:
        this.gl.bindTexture(this.target, this.handle);
        const value = this.gl.getTexParameter(this.target, pname);
        this.gl.bindTexture(this.target, null);
        return value;
    }
  }

  _setParameter(pname, param) {
    this.gl.bindTexture(this.target, this.handle);
    param = this._getNPOTParam(pname, param);

    switch (pname) {
      case 33082:
      case 33083:
        this.gl.texParameterf(this.handle, pname, param);
        break;

      case 4096:
      case 4097:
        assert(false);
        break;

      default:
        this.gl.texParameteri(this.target, pname, param);
        break;
    }

    this.gl.bindTexture(this.target, null);
    return this;
  }

  _isNPOT() {
    if (isWebGL2(this.gl)) {
      return false;
    }

    if (!this.width || !this.height) {
      return false;
    }

    return !isPowerOfTwo(this.width) || !isPowerOfTwo(this.height);
  }

  _updateForNPOT(parameters) {
    if (parameters[this.gl.TEXTURE_MIN_FILTER] === undefined) {
      parameters[this.gl.TEXTURE_MIN_FILTER] = this.gl.LINEAR;
    }

    if (parameters[this.gl.TEXTURE_WRAP_S] === undefined) {
      parameters[this.gl.TEXTURE_WRAP_S] = this.gl.CLAMP_TO_EDGE;
    }

    if (parameters[this.gl.TEXTURE_WRAP_T] === undefined) {
      parameters[this.gl.TEXTURE_WRAP_T] = this.gl.CLAMP_TO_EDGE;
    }
  }

  _getNPOTParam(pname, param) {
    if (this._isNPOT()) {
      switch (pname) {
        case 10241:
          if (NPOT_MIN_FILTERS.indexOf(param) === -1) {
            param = 9729;
          }

          break;

        case 10242:
        case 10243:
          if (param !== 33071) {
            param = 33071;
          }

          break;

        default:
          break;
      }
    }

    return param;
  }

}
//# sourceMappingURL=texture.js.map