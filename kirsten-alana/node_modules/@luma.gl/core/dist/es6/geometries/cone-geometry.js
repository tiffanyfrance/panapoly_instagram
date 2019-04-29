import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import TruncatedConeGeometry from './truncated-cone-geometry';
import { uid } from '../utils';
export default class ConeGeometry extends TruncatedConeGeometry {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('cone-geometry') : _props$id,
          _props$radius = props.radius,
          radius = _props$radius === void 0 ? 1 : _props$radius,
          _props$cap = props.cap,
          cap = _props$cap === void 0 ? true : _props$cap;
    super(_objectSpread({}, props, {
      id,
      topRadius: 0,
      topCap: Boolean(cap),
      bottomCap: Boolean(cap),
      bottomRadius: radius
    }));
  }

}
//# sourceMappingURL=cone-geometry.js.map