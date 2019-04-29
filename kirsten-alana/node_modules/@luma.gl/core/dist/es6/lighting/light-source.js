import { Vector3 } from 'math.gl';
import { uid } from '../utils';
const DEFAULT_LIGHT_COLOR = [255, 255, 255];
const DEFAULT_LIGHT_INTENSITY = 1.0;
const DEFAULT_ATTENUATION = [0, 0, 1];
const DEFAULT_LIGHT_DIRECTION = [0.0, 0.0, -1.0];
const DEFAULT_LIGHT_POSITION = [0.0, 0.0, 1.0];

class Light {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.id = props.id || uid('light');
    const _props$color = props.color,
          color = _props$color === void 0 ? DEFAULT_LIGHT_COLOR : _props$color;
    this.color = color;
    const _props$intensity = props.intensity,
          intensity = _props$intensity === void 0 ? DEFAULT_LIGHT_INTENSITY : _props$intensity;
    this.intensity = intensity;
  }

}

export class AmbientLight extends Light {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super(props);
    this.type = 'ambient';
  }

}
export class DirectionalLight extends Light {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super(props);
    this.type = 'directional';
    const _props$direction = props.direction,
          direction = _props$direction === void 0 ? DEFAULT_LIGHT_DIRECTION : _props$direction;
    this.direction = new Vector3(direction).normalize().toArray();
  }

}
export class PointLight extends Light {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super(props);
    this.type = 'point';
    const _props$position = props.position,
          position = _props$position === void 0 ? DEFAULT_LIGHT_POSITION : _props$position;
    this.position = position;
    this.attenuation = this._getAttenuation(props);
  }

  _getAttenuation(props) {
    if ('attenuation' in props) {
      return props.attenuation;
    }

    if ('intensity' in props) {
      return [0, 0, props.intensity];
    }

    return DEFAULT_ATTENUATION;
  }

}
//# sourceMappingURL=light-source.js.map