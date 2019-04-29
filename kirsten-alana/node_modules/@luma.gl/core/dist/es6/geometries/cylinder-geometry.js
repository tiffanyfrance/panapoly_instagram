import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import TruncatedConeGeometry from './truncated-cone-geometry';
import { uid } from '../utils';
export default class CylinderGeometry extends TruncatedConeGeometry {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _props$id = props.id,
          id = _props$id === void 0 ? uid('cylinder-geometry') : _props$id,
          _props$radius = props.radius,
          radius = _props$radius === void 0 ? 1 : _props$radius;
    super(_objectSpread({}, props, {
      id,
      bottomRadius: radius,
      topRadius: radius
    }));
  }

}
//# sourceMappingURL=cylinder-geometry.js.map