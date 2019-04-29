import Pass from './pass';
export default class ClearPass extends Pass {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, Object.assign({
      id: 'clear-pass'
    }, props));
  }

  _renderPass(_ref) {
    let gl = _ref.gl;
    const _this$props$clearBits = this.props.clearBits,
          clearBits = _this$props$clearBits === void 0 ? 16384 | 256 : _this$props$clearBits;
    gl.clear(clearBits);
  }

}
//# sourceMappingURL=clear-pass.js.map