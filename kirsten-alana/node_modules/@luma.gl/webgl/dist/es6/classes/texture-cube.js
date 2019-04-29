import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import Texture from './texture';
import { assertWebGLContext } from '../webgl-utils';
import { log } from '../utils';
const FACES = [34069, 34070, 34071, 34072, 34073, 34074];
export default class TextureCube extends Texture {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    assertWebGLContext(gl);
    super(gl, Object.assign({}, props, {
      target: 34067
    }));
    this.initialize(props);
    Object.seal(this);
  }

  initialize() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _props$mipmaps = props.mipmaps,
          mipmaps = _props$mipmaps === void 0 ? true : _props$mipmaps,
          _props$parameters = props.parameters,
          parameters = _props$parameters === void 0 ? {} : _props$parameters;
    this.opts = props;
    this.setCubeMapImageData(props).then(() => {
      this.loaded = true;

      if (mipmaps) {
        this.generateMipmap(props);
      }

      this.setParameters(parameters);
    });
  }

  subImage(_ref) {
    let face = _ref.face,
        data = _ref.data,
        _ref$x = _ref.x,
        x = _ref$x === void 0 ? 0 : _ref$x,
        _ref$y = _ref.y,
        y = _ref$y === void 0 ? 0 : _ref$y,
        _ref$mipmapLevel = _ref.mipmapLevel,
        mipmapLevel = _ref$mipmapLevel === void 0 ? 0 : _ref$mipmapLevel;
    return this._subImage({
      target: face,
      data,
      x,
      y,
      mipmapLevel
    });
  }

  setCubeMapImageData(_ref2) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let width = _ref2.width,
          height = _ref2.height,
          pixels = _ref2.pixels,
          data = _ref2.data,
          _ref2$border = _ref2.border,
          border = _ref2$border === void 0 ? 0 : _ref2$border,
          _ref2$format = _ref2.format,
          format = _ref2$format === void 0 ? 6408 : _ref2$format,
          _ref2$type = _ref2.type,
          type = _ref2$type === void 0 ? 5121 : _ref2$type;
      const gl = _this.gl;
      const imageDataMap = pixels || data;
      const resolvedFaces = yield Promise.all(FACES.map(face => {
        const facePixels = imageDataMap[face];
        return Promise.all(Array.isArray(facePixels) ? facePixels : [facePixels]);
      }));

      _this.bind();

      FACES.forEach((face, index) => {
        if (resolvedFaces[index].length > 1 && _this.opts.mipmaps !== false) {
          log.warn("".concat(_this.id, " has mipmap and multiple LODs."))();
        }

        resolvedFaces[index].forEach((image, lodLevel) => {
          if (width && height) {
            gl.texImage2D(face, lodLevel, format, width, height, border, format, type, image);
          } else {
            gl.texImage2D(face, lodLevel, format, format, type, image);
          }
        });
      });

      _this.unbind();
    })();
  }

  setImageDataForFace(options) {
    const face = options.face,
          width = options.width,
          height = options.height,
          pixels = options.pixels,
          data = options.data,
          _options$border = options.border,
          border = _options$border === void 0 ? 0 : _options$border,
          _options$format = options.format,
          format = _options$format === void 0 ? 6408 : _options$format,
          _options$type = options.type,
          type = _options$type === void 0 ? 5121 : _options$type;
    const gl = this.gl;
    const imageData = pixels || data;
    this.bind();

    if (imageData instanceof Promise) {
      imageData.then(resolvedImageData => this.setImageDataForFace(Object.assign({}, options, {
        face,
        data: resolvedImageData,
        pixels: resolvedImageData
      })));
    } else if (this.width || this.height) {
      gl.texImage2D(face, 0, format, width, height, border, format, type, imageData);
    } else {
      gl.texImage2D(face, 0, format, format, type, imageData);
    }

    return this;
  }

}
TextureCube.FACES = FACES;
//# sourceMappingURL=texture-cube.js.map