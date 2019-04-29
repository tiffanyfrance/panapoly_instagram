import Pass from './pass';
export default class RenderPass extends Pass {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, Object.assign({
      id: 'render-pass'
    }, props));
  }

  _renderPass(_ref) {
    let animationProps = _ref.animationProps;
    const _this$props = this.props,
          _this$props$models = _this$props.models,
          models = _this$props$models === void 0 ? [] : _this$props$models,
          drawParams = _this$props.drawParams;

    for (const model of models) {
      model.draw(Object.assign({}, drawParams, {
        animationProps
      }));
    }
  }

}
//# sourceMappingURL=render-pass.js.map