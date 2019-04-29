import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import Resource from './resource';
import Texture2D from './texture-2d';
import Renderbuffer from './renderbuffer';
import { clear, clearBuffer } from './clear';
import { copyToDataUrl } from './copy-and-blit.js';
import { getFeatures } from '../features';
import { isWebGL2, assertWebGL2Context, getKey } from '../webgl-utils';
import { log, assert } from '../utils';
const ERR_MULTIPLE_RENDERTARGETS = 'Multiple render targets not supported';
export default class Framebuffer extends Resource {
  static isSupported(gl) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        colorBufferFloat = _ref.colorBufferFloat,
        colorBufferHalfFloat = _ref.colorBufferHalfFloat;

    let supported = true;
    supported = colorBufferFloat && gl.getExtension(isWebGL2(gl) ? 'EXT_color_buffer_float' : 'WEBGL.color_buffer_float');
    supported = colorBufferHalfFloat && gl.getExtension(isWebGL2(gl) ? 'EXT_color_buffer_float' : 'EXT_color_buffer_half_float');
    return supported;
  }

  static getDefaultFramebuffer(gl) {
    gl.luma = gl.luma || {};
    gl.luma.defaultFramebuffer = gl.luma.defaultFramebuffer || new Framebuffer(gl, {
      id: 'default-framebuffer',
      handle: null,
      attachments: {}
    });
    return gl.luma.defaultFramebuffer;
  }

  get MAX_COLOR_ATTACHMENTS() {
    return this.gl.getParameter(this.gl.MAX_COLOR_ATTACHMENTS);
  }

  get MAX_DRAW_BUFFERS() {
    return this.gl.getParameter(this.gl.MAX_DRAW_BUFFERS);
  }

  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, opts);
    this.width = null;
    this.height = null;
    this.attachments = {};
    this.readBuffer = 36064;
    this.drawBuffers = [36064];
    this.initialize(opts);
    Object.seal(this);
  }

  get color() {
    return this.attachments[36064] || null;
  }

  get texture() {
    return this.attachments[36064] || null;
  }

  get depth() {
    return this.attachments[36096] || this.attachments[33306] || null;
  }

  get stencil() {
    return this.attachments[36128] || this.attachments[33306] || null;
  }

  initialize(_ref2) {
    let _ref2$width = _ref2.width,
        width = _ref2$width === void 0 ? 1 : _ref2$width,
        _ref2$height = _ref2.height,
        height = _ref2$height === void 0 ? 1 : _ref2$height,
        _ref2$attachments = _ref2.attachments,
        attachments = _ref2$attachments === void 0 ? null : _ref2$attachments,
        _ref2$color = _ref2.color,
        color = _ref2$color === void 0 ? true : _ref2$color,
        _ref2$depth = _ref2.depth,
        depth = _ref2$depth === void 0 ? true : _ref2$depth,
        _ref2$stencil = _ref2.stencil,
        stencil = _ref2$stencil === void 0 ? false : _ref2$stencil,
        _ref2$check = _ref2.check,
        check = _ref2$check === void 0 ? true : _ref2$check,
        readBuffer = _ref2.readBuffer,
        drawBuffers = _ref2.drawBuffers;
    assert(width >= 0 && height >= 0, 'Width and height need to be integers');
    this.width = width;
    this.height = height;

    if (attachments) {
      for (const attachment in attachments) {
        const target = attachments[attachment];
        const object = Array.isArray(target) ? target[0] : target;
        object.resize({
          width,
          height
        });
      }
    } else {
      attachments = this._createDefaultAttachments(color, depth, stencil, width, height);
    }

    this.update({
      clearAttachments: true,
      attachments,
      readBuffer,
      drawBuffers
    });

    if (attachments && check) {
      this.checkStatus();
    }
  }

  update(_ref3) {
    let _ref3$attachments = _ref3.attachments,
        attachments = _ref3$attachments === void 0 ? {} : _ref3$attachments,
        readBuffer = _ref3.readBuffer,
        drawBuffers = _ref3.drawBuffers,
        _ref3$clearAttachment = _ref3.clearAttachments,
        clearAttachments = _ref3$clearAttachment === void 0 ? false : _ref3$clearAttachment,
        _ref3$resizeAttachmen = _ref3.resizeAttachments,
        resizeAttachments = _ref3$resizeAttachmen === void 0 ? true : _ref3$resizeAttachmen;
    this.attach(attachments, {
      clearAttachments,
      resizeAttachments
    });
    const gl = this.gl;
    const prevHandle = gl.bindFramebuffer(36160, this.handle);

    if (readBuffer) {
      this._setReadBuffer(readBuffer);
    }

    if (drawBuffers) {
      this._setDrawBuffers(drawBuffers);
    }

    gl.bindFramebuffer(36160, prevHandle || null);
    return this;
  }

  resize() {
    let _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        width = _ref4.width,
        height = _ref4.height;

    if (this.handle === null) {
      assert(width === undefined && height === undefined);
      this.width = this.gl.drawingBufferWidth;
      this.height = this.gl.drawingBufferHeight;
      return this;
    }

    if (width === undefined) {
      width = this.gl.drawingBufferWidth;
    }

    if (height === undefined) {
      height = this.gl.drawingBufferHeight;
    }

    if (width !== this.width && height !== this.height) {
      log.log(2, "Resizing framebuffer ".concat(this.id, " to ").concat(width, "x").concat(height))();
    }

    for (const attachmentPoint in this.attachments) {
      this.attachments[attachmentPoint].resize({
        width,
        height
      });
    }

    this.width = width;
    this.height = height;
    return this;
  }

  attach(attachments) {
    let _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref5$clearAttachment = _ref5.clearAttachments,
        clearAttachments = _ref5$clearAttachment === void 0 ? false : _ref5$clearAttachment,
        _ref5$resizeAttachmen = _ref5.resizeAttachments,
        resizeAttachments = _ref5$resizeAttachmen === void 0 ? true : _ref5$resizeAttachmen;

    const newAttachments = {};

    if (clearAttachments) {
      Object.keys(this.attachments).forEach(key => {
        newAttachments[key] = null;
      });
    }

    Object.assign(newAttachments, attachments);
    const prevHandle = this.gl.bindFramebuffer(36160, this.handle);

    for (const key in newAttachments) {
      assert(key !== undefined, 'Misspelled framebuffer binding point?');
      const attachment = Number(key);
      const descriptor = newAttachments[attachment];
      let object = descriptor;

      if (!object) {
        this._unattach(attachment);
      } else if (object instanceof Renderbuffer) {
        this._attachRenderbuffer({
          attachment,
          renderbuffer: object
        });
      } else if (Array.isArray(descriptor)) {
        const _descriptor = _slicedToArray(descriptor, 3),
              texture = _descriptor[0],
              _descriptor$ = _descriptor[1],
              layer = _descriptor$ === void 0 ? 0 : _descriptor$,
              _descriptor$2 = _descriptor[2],
              level = _descriptor$2 === void 0 ? 0 : _descriptor$2;

        object = texture;

        this._attachTexture({
          attachment,
          texture,
          layer,
          level
        });
      } else {
        this._attachTexture({
          attachment,
          texture: object,
          layer: 0,
          level: 0
        });
      }

      if (resizeAttachments && object) {
        object.resize({
          width: this.width,
          height: this.height
        });
      }
    }

    this.gl.bindFramebuffer(36160, prevHandle || null);
    Object.assign(this.attachments, attachments);
    Object.keys(this.attachments).filter(key => !this.attachments[key]).forEach(key => {
      delete this.attachments[key];
    });
  }

  checkStatus() {
    const gl = this.gl;
    const prevHandle = gl.bindFramebuffer(36160, this.handle);
    const status = gl.checkFramebufferStatus(36160);
    gl.bindFramebuffer(36160, prevHandle || null);

    if (status !== 36053) {
      throw new Error(_getFrameBufferStatus(status));
    }

    return this;
  }

  clear() {
    let _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        color = _ref6.color,
        depth = _ref6.depth,
        stencil = _ref6.stencil,
        _ref6$drawBuffers = _ref6.drawBuffers,
        drawBuffers = _ref6$drawBuffers === void 0 ? [] : _ref6$drawBuffers;

    const prevHandle = this.gl.bindFramebuffer(36160, this.handle);

    if (color || depth || stencil) {
      clear(this.gl, {
        color,
        depth,
        stencil
      });
    }

    drawBuffers.forEach((value, drawBuffer) => {
      clearBuffer({
        drawBuffer,
        value
      });
    });
    this.gl.bindFramebuffer(36160, prevHandle || null);
    return this;
  }

  readPixels() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.readPixels() is no logner supported, use readPixelsToArray(framebuffer)')();
    return null;
  }

  readPixelsToBuffer() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.readPixelsToBuffer()is no logner supported, use readPixelsToBuffer(framebuffer)')();
    return null;
  }

  copyToDataUrl() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.copyToDataUrl() is no logner supported, use copyToDataUrl(framebuffer)')();
    return null;
  }

  copyToImage() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.copyToImage() is no logner supported, use copyToImage(framebuffer)')();
    return null;
  }

  copyToTexture() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.copyToTexture({...}) is no logner supported, use copyToTexture(source, target, opts})')();
    return null;
  }

  blit() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    log.error('Framebuffer.blit({...}) is no logner supported, use blit(source, target, opts)')();
    return null;
  }

  invalidate(_ref7) {
    let _ref7$attachments = _ref7.attachments,
        attachments = _ref7$attachments === void 0 ? [] : _ref7$attachments,
        _ref7$x = _ref7.x,
        x = _ref7$x === void 0 ? 0 : _ref7$x,
        _ref7$y = _ref7.y,
        y = _ref7$y === void 0 ? 0 : _ref7$y,
        width = _ref7.width,
        height = _ref7.height;
    const gl = this.gl;
    assertWebGL2Context(gl);
    const prevHandle = gl.bindFramebuffer(36008, this.handle);
    const invalidateAll = x === 0 && y === 0 && width === undefined && height === undefined;

    if (invalidateAll) {
      gl.invalidateFramebuffer(36008, attachments);
    } else {
      gl.invalidateFramebuffer(36008, attachments, x, y, width, height);
    }

    gl.bindFramebuffer(36008, prevHandle);
    return this;
  }

  getAttachmentParameter(attachment, pname, keys) {
    let value = this._getAttachmentParameterFallback(pname);

    if (value === null) {
      this.gl.bindFramebuffer(36160, this.handle);
      value = this.gl.getFramebufferAttachmentParameter(36160, attachment, pname);
      this.gl.bindFramebuffer(36160, null);
    }

    if (keys && value > 1000) {
      value = getKey(this.gl, value);
    }

    return value;
  }

  getAttachmentParameters() {
    let attachment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 36064;
    let keys = arguments.length > 1 ? arguments[1] : undefined;
    let parameters = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.constructor.ATTACHMENT_PARAMETERS || [];
    const values = {};

    for (const pname of parameters) {
      const key = keys ? getKey(this.gl, pname) : pname;
      values[key] = this.getAttachmentParameter(attachment, pname, keys);
    }

    return values;
  }

  getParameters() {
    let keys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    const attachments = Object.keys(this.attachments);
    const parameters = {};

    for (const attachmentName of attachments) {
      const attachment = Number(attachmentName);
      const key = keys ? getKey(this.gl, attachment) : attachment;
      parameters[key] = this.getAttachmentParameters(attachment, keys);
    }

    return parameters;
  }

  show() {
    if (typeof window !== 'undefined') {
      window.open(copyToDataUrl(this), 'luma-debug-texture');
    }

    return this;
  }

  log() {
    let priority = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    let message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    if (priority > log.priority || typeof window === 'undefined') {
      return this;
    }

    message = message || "Framebuffer ".concat(this.id);
    const image = copyToDataUrl(this, {
      maxHeight: 100
    });
    log.image({
      priority,
      message,
      image
    }, message)();
    return this;
  }

  bind() {
    let _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref8$target = _ref8.target,
        target = _ref8$target === void 0 ? 36160 : _ref8$target;

    this.gl.bindFramebuffer(target, this.handle);
    return this;
  }

  unbind() {
    let _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref9$target = _ref9.target,
        target = _ref9$target === void 0 ? 36160 : _ref9$target;

    this.gl.bindFramebuffer(target, null);
    return this;
  }

  _createDefaultAttachments(color, depth, stencil, width, height) {
    let defaultAttachments = null;

    if (color) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[36064] = new Texture2D(this.gl, {
        id: "".concat(this.id, "-color0"),
        pixels: null,
        format: 6408,
        type: 5121,
        width,
        height,
        mipmaps: false,
        parameters: {
          [10241]: 9728,
          [10240]: 9728,
          [10242]: 33071,
          [10243]: 33071
        }
      });
    }

    if (depth && stencil) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[33306] = new Renderbuffer(this.gl, {
        id: "".concat(this.id, "-depth-stencil"),
        format: 35056,
        width,
        height: 111
      });
    } else if (depth) {
      defaultAttachments = defaultAttachments || {};
      defaultAttachments[36096] = new Renderbuffer(this.gl, {
        id: "".concat(this.id, "-depth"),
        format: 33189,
        width,
        height
      });
    } else if (stencil) {
      assert(false);
    }

    return defaultAttachments;
  }

  _unattach(attachment) {
    const oldAttachment = this.attachments[attachment];

    if (!oldAttachment) {
      return;
    }

    if (oldAttachment instanceof Renderbuffer) {
      this.gl.framebufferRenderbuffer(36160, attachment, 36161, null);
    } else {
      this.gl.framebufferTexture2D(36160, attachment, 3553, null, 0);
    }

    delete this.attachments[attachment];
  }

  _attachRenderbuffer(_ref10) {
    let _ref10$attachment = _ref10.attachment,
        attachment = _ref10$attachment === void 0 ? 36064 : _ref10$attachment,
        renderbuffer = _ref10.renderbuffer;
    const gl = this.gl;
    gl.framebufferRenderbuffer(36160, attachment, 36161, renderbuffer.handle);
    this.attachments[attachment] = renderbuffer;
  }

  _attachTexture(_ref11) {
    let _ref11$attachment = _ref11.attachment,
        attachment = _ref11$attachment === void 0 ? 36064 : _ref11$attachment,
        texture = _ref11.texture,
        layer = _ref11.layer,
        level = _ref11.level;
    const gl = this.gl;
    gl.bindTexture(texture.target, texture.handle);

    switch (texture.target) {
      case 35866:
      case 32879:
        gl.framebufferTextureLayer(36160, attachment, texture.target, level, layer);
        break;

      case 34067:
        const face = mapIndexToCubeMapFace(layer);
        gl.framebufferTexture2D(36160, attachment, face, texture.handle, level);
        break;

      case 3553:
        gl.framebufferTexture2D(36160, attachment, 3553, texture.handle, level);
        break;

      default:
        assert(false, 'Illegal texture type');
    }

    gl.bindTexture(texture.target, null);
    this.attachments[attachment] = texture;
  }

  _setReadBuffer(gl, readBuffer) {
    if (isWebGL2(gl)) {
      gl.readBuffer(readBuffer);
    } else {
      assert(readBuffer === 36064 || readBuffer === 1029, ERR_MULTIPLE_RENDERTARGETS);
    }

    this.readBuffer = readBuffer;
  }

  _setDrawBuffers(gl, drawBuffers) {
    if (isWebGL2(gl)) {
      gl.drawBuffers(drawBuffers);
    } else {
      const ext = gl.getExtension('WEBGL.draw_buffers');

      if (ext) {
        ext.drawBuffersWEBGL(drawBuffers);
      } else {
        assert(drawBuffers.length === 1 && (drawBuffers[0] === 36064 || drawBuffers[0] === 1029), ERR_MULTIPLE_RENDERTARGETS);
      }
    }

    this.drawBuffers = drawBuffers;
  }

  _getAttachmentParameterFallback(pname) {
    const caps = getFeatures(this.gl);

    switch (pname) {
      case 36052:
        return !caps.webgl2 ? 0 : null;

      case 33298:
      case 33299:
      case 33300:
      case 33301:
      case 33302:
      case 33303:
        return !caps.webgl2 ? 8 : null;

      case 33297:
        return !caps.webgl2 ? 5125 : null;

      case 33296:
        return !caps.webgl2 && !caps.EXT_sRGB ? 9729 : null;

      default:
        return null;
    }
  }

  _createHandle() {
    return this.gl.createFramebuffer();
  }

  _deleteHandle() {
    this.gl.deleteFramebuffer(this.handle);
  }

  _bindHandle(handle) {
    return this.gl.bindFramebuffer(36160, handle);
  }

}

function mapIndexToCubeMapFace(layer) {
  return layer < 34069 ? layer + 34069 : layer;
}

function _getFrameBufferStatus(status) {
  const STATUS = Framebuffer.STATUS || {};
  return STATUS[status] || "Framebuffer error ".concat(status);
}

export const FRAMEBUFFER_ATTACHMENT_PARAMETERS = [36049, 36048, 33296, 33298, 33299, 33300, 33301, 33302, 33303];
Framebuffer.ATTACHMENT_PARAMETERS = FRAMEBUFFER_ATTACHMENT_PARAMETERS;
//# sourceMappingURL=framebuffer.js.map