import GL_STATE_SETTERS from './webgl-function-to-parameters-table';
import { GL_PARAMETER_DEFAULTS } from '../unified-parameter-api/webgl-parameter-tables';
import { setParameters, getParameters } from '../unified-parameter-api/unified-parameter-api';
import { assert } from '../utils';
export const clone = x => {
  return Array.isArray(x) || ArrayBuffer.isView(x) ? x.slice() : x;
};
export const deepEqual = (x, y) => {
  const isArrayX = Array.isArray(x) || ArrayBuffer.isView(x);
  const isArrayY = Array.isArray(y) || ArrayBuffer.isView(y);

  if (isArrayX && isArrayY && x.length === y.length) {
    for (let i = 0; i < x.length; ++i) {
      if (x[i] !== y[i]) {
        return false;
      }
    }

    return true;
  }

  return x === y;
};

function installGetterOverride(gl, functionName) {
  const originalGetterFunc = gl[functionName].bind(gl);

  gl[functionName] = function get() {
    const pname = arguments.length <= 0 ? undefined : arguments[0];

    if (!(pname in gl.state.cache)) {
      gl.state.cache[pname] = originalGetterFunc(...arguments);
    }

    return gl.state.enable ? gl.state.cache[pname] : originalGetterFunc(...arguments);
  };

  Object.defineProperty(gl[functionName], 'name', {
    value: "".concat(functionName, "-from-cache"),
    configurable: false
  });
}

function installSetterSpy(gl, functionName, setter) {
  const originalSetterFunc = gl[functionName].bind(gl);

  gl[functionName] = function set() {
    for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    const _setter = setter(gl.state._updateCache, ...params),
          valueChanged = _setter.valueChanged,
          oldValue = _setter.oldValue;

    if (valueChanged) {
      gl.state.log("gl.".concat(functionName), ...params);
      originalSetterFunc(...params);
    }

    return oldValue;
  };

  Object.defineProperty(gl[functionName], 'name', {
    value: "".concat(functionName, "-to-cache"),
    configurable: false
  });
}

class GLState {
  constructor(gl) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$copyState = _ref.copyState,
        copyState = _ref$copyState === void 0 ? false : _ref$copyState,
        _ref$log = _ref.log,
        log = _ref$log === void 0 ? () => {} : _ref$log;

    this.gl = gl;
    this.stateStack = [];
    this.enable = true;
    this.cache = copyState ? getParameters(gl) : Object.assign({}, GL_PARAMETER_DEFAULTS);
    this.log = log;
    this._updateCache = this._updateCache.bind(this);
    Object.seal(this);
  }

  push() {
    let values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.stateStack.push({});
  }

  pop() {
    assert(this.stateStack.length > 0);
    const oldValues = this.stateStack[this.stateStack.length - 1];
    setParameters(this.gl, oldValues, this.cache);
    this.stateStack.pop();
  }

  _updateCache(values) {
    let valueChanged = false;
    let oldValue;
    const oldValues = this.stateStack.length > 0 && this.stateStack[this.stateStack.length - 1];

    for (const key in values) {
      assert(key !== undefined);

      if (!deepEqual(values[key], this.cache[key])) {
        valueChanged = true;
        oldValue = this.cache[key];

        if (oldValues && !(key in oldValues)) {
          oldValues[key] = this.cache[key];
        }

        this.cache[key] = values[key];
      }
    }

    return {
      valueChanged,
      oldValue
    };
  }

}

export default function trackContextState(gl) {
  let _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref2$enable = _ref2.enable,
      enable = _ref2$enable === void 0 ? true : _ref2$enable,
      copyState = _ref2.copyState;

  assert(copyState !== undefined);

  if (!gl.state) {
    const global_ = typeof global !== 'undefined' ? global : window;

    if (global_.polyfillContext) {
      global_.polyfillContext(gl);
    }

    gl.state = new GLState(gl, {
      copyState,
      enable
    });

    for (const key in GL_STATE_SETTERS) {
      const setter = GL_STATE_SETTERS[key];
      installSetterSpy(gl, key, setter);
    }

    installGetterOverride(gl, 'getParameter');
    installGetterOverride(gl, 'isEnabled');
  }

  gl.state.enable = enable;
  return gl;
}
export function pushContextState(gl) {
  if (!gl.state) {
    trackContextState(gl, {
      copyState: false
    });
  }

  gl.state.push();
}
export function popContextState(gl) {
  assert(gl.state);
  gl.state.pop();
}
//# sourceMappingURL=track-context-state.js.map