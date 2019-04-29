import Texture2D from '../classes/texture-2d';
import TextureCube from '../classes/texture-cube';
import Texture3D from '../classes/texture-3d';
import Framebuffer from '../classes/framebuffer';
import { assert } from '../utils';
export function cloneTextureFrom(refTexture, overrides) {
  assert(refTexture instanceof Texture2D || refTexture instanceof TextureCube || refTexture instanceof Texture3D);
  const TextureType = refTexture.constructor;
  const gl = refTexture.gl,
        width = refTexture.width,
        height = refTexture.height,
        format = refTexture.format,
        type = refTexture.type,
        dataFormat = refTexture.dataFormat,
        border = refTexture.border,
        mipmaps = refTexture.mipmaps;
  const textureOptions = Object.assign({
    width,
    height,
    format,
    type,
    dataFormat,
    border,
    mipmaps
  }, overrides);
  return new TextureType(gl, textureOptions);
}
export function toFramebuffer(texture, opts) {
  const gl = texture.gl,
        width = texture.width,
        height = texture.height,
        id = texture.id;
  const framebuffer = new Framebuffer(gl, Object.assign({}, opts, {
    id: "framebuffer-for-".concat(id),
    width,
    height,
    attachments: {
      [36064]: texture
    }
  }));
  return framebuffer;
}
//# sourceMappingURL=texture-utils.js.map