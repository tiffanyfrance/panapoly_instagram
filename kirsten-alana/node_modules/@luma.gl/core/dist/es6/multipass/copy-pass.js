import ClipSpace from '../lib/clip-space';
import Pass from './pass';
const fs = "uniform sampler2D uDiffuseSampler;\nuniform float uOpacity;\n\nvarying vec2 uv;\n\nvoid main() {\n  vec4 texel = texture2D(uDiffuseSampler, uv);\n  gl_FragColor = uOpacity * texel;\n}\n";
export default class CopyPass extends Pass {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, Object.assign({
      id: 'copy-pass',
      swap: true
    }, props));
    this.clipspace = new ClipSpace(gl, {
      id: 'copy-pass',
      fs
    });
  }

  _renderPass(_ref) {
    let inputBuffer = _ref.inputBuffer;
    const _this$props$opacity = this.props.opacity,
          opacity = _this$props$opacity === void 0 ? 1.0 : _this$props$opacity;
    this.clipspace.draw({
      uniforms: {
        uDiffuseSampler: inputBuffer,
        uOpacity: opacity
      },
      parameters: {
        depthWrite: false,
        depthTest: false
      }
    });
  }

}
//# sourceMappingURL=copy-pass.js.map