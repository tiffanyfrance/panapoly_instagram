import { withParameters } from '../context';
import { isWebGL2, assertWebGL2Context } from '../webgl-utils';
import Texture from './texture';
import { DATA_FORMAT_CHANNELS, TYPE_SIZES } from './texture-formats';
import Buffer from './buffer';
export default class Texture3D extends Texture {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    assertWebGL2Context(gl);
    props = Object.assign({
      depth: 1
    }, props, {
      target: 32879,
      unpackFlipY: false
    });
    super(gl, props);
    this.initialize(props);
    Object.seal(this);
  }

  setImageData(_ref) {
    let _ref$level = _ref.level,
        level = _ref$level === void 0 ? 0 : _ref$level,
        _ref$dataFormat = _ref.dataFormat,
        dataFormat = _ref$dataFormat === void 0 ? 6408 : _ref$dataFormat,
        width = _ref.width,
        height = _ref.height,
        _ref$depth = _ref.depth,
        depth = _ref$depth === void 0 ? 1 : _ref$depth,
        _ref$border = _ref.border,
        border = _ref$border === void 0 ? 0 : _ref$border,
        format = _ref.format,
        _ref$type = _ref.type,
        type = _ref$type === void 0 ? 5121 : _ref$type,
        _ref$offset = _ref.offset,
        offset = _ref$offset === void 0 ? 0 : _ref$offset,
        data = _ref.data,
        _ref$parameters = _ref.parameters,
        parameters = _ref$parameters === void 0 ? {} : _ref$parameters;

    this._trackDeallocatedMemory('Texture');

    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, parameters, () => {
      if (ArrayBuffer.isView(data)) {
        this.gl.texImage3D(this.target, level, dataFormat, width, height, depth, border, format, type, data);
      }

      if (data instanceof Buffer) {
        this.gl.bindBuffer(35052, data.handle);
        this.gl.texImage3D(this.target, level, dataFormat, width, height, depth, border, format, type, offset);
      }
    });

    if (data && data.byteLength) {
      this._trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this._trackAllocatedMemory(this.width * this.height * this.depth * channels * channelSize, 'Texture');
    }

    this.loaded = true;
    return this;
  }

}
//# sourceMappingURL=texture-3d.js.map