import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import { uid, assert } from '../utils';
export const DRAW_MODE = {
  POINTS: 0x0000,
  LINES: 0x0001,
  LINE_LOOP: 0x0002,
  LINE_STRIP: 0x0003,
  TRIANGLES: 0x0004,
  TRIANGLE_STRIP: 0x0005,
  TRIANGLE_FAN: 0x0006
};
export default class Geometry {
  static get DRAW_MODE() {
    return DRAW_MODE;
  }

  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('geometry') : _props$id,
          _props$drawMode = props.drawMode,
          drawMode = _props$drawMode === void 0 ? DRAW_MODE.TRIANGLES : _props$drawMode,
          mode = props.mode,
          _props$attributes = props.attributes,
          attributes = _props$attributes === void 0 ? {} : _props$attributes,
          _props$indices = props.indices,
          indices = _props$indices === void 0 ? null : _props$indices,
          _props$vertexCount = props.vertexCount,
          vertexCount = _props$vertexCount === void 0 ? null : _props$vertexCount;
    this.id = id;
    this.drawMode = drawMode | 0 || mode | 0;
    this.attributes = {};
    this.userData = {};

    this._setAttributes(attributes, indices);

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
  }

  get mode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  getAttributes() {
    return this.indices ? _objectSpread({
      indices: this.indices
    }, this.attributes) : this.attributes;
  }

  _print(attributeName) {
    return "Geometry ".concat(this.id, " attribute ").concat(attributeName);
  }

  _setAttributes(attributes, indices) {
    if (indices) {
      this.indices = ArrayBuffer.isView(indices) ? {
        value: indices,
        size: 1
      } : indices;
    }

    for (const attributeName in attributes) {
      let attribute = attributes[attributeName];
      attribute = ArrayBuffer.isView(attribute) ? {
        value: attribute
      } : attribute;
      assert(ArrayBuffer.isView(attribute.value), "".concat(this._print(attributeName), ": must be typed array or object with value as typed array"));

      if (attributeName === 'indices') {
        assert(!this.indices);
        this.indices = attribute;

        if (this.indices.isIndexed !== undefined) {
          this.indices = Object.assign({}, this.indices);
          delete this.indices.isIndexed;
        }
      } else {
        this.attributes[attributeName] = attribute;
      }
    }

    return this;
  }

  _calculateVertexCount(attributes, indices) {
    if (indices) {
      return indices.value.length;
    }

    let vertexCount = Infinity;

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const value = attribute.value,
            size = attribute.size,
            constant = attribute.constant;

      if (!constant && value && size >= 1) {
        vertexCount = Math.min(vertexCount, value.length / size);
      }
    }

    if (!Number.isFinite(vertexCount)) {
      const attribute = attributes.POSITION || attributes.positions;

      if (attribute) {
        vertexCount = attribute.value && attribute.value.length / (attribute.size || 3);
      }
    }

    assert(Number.isFinite(vertexCount));
    return vertexCount;
  }

}
//# sourceMappingURL=geometry.js.map