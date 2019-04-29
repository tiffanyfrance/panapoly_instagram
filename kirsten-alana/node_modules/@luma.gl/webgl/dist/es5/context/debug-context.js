"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enableDebug = enableDebug;
exports.makeDebugContext = makeDebugContext;
exports.getRealContext = getRealContext;
exports.getDebugContext = getDebugContext;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _globals = require("../utils/globals");

var _utils = require("../utils");

function getContextData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

function enableDebug(debug) {}

function makeDebugContext(gl) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? true : _ref$debug;

  if (gl === null) {
    return null;
  }

  return debug ? getDebugContext(gl) : getRealContext(gl);
}

function getRealContext(gl) {
  if (gl === null) {
    return null;
  }

  var data = getContextData(gl);
  return data.realContext ? data.realContext : gl;
}

function getDebugContext(gl) {
  if (gl === null) {
    return null;
  }

  if (!_globals.global.WebGLDebug) {
    console.warn('WebGL debug mode not activated. import "@luma.gl/debug" to enable.')();
    return gl;
  }

  var data = getContextData(gl);

  if (data.realContext) {
    return gl;
  }

  if (data.debugContext) {
    return data.debugContext;
  }

  var WebGLDebugContext = function WebGLDebugContext() {
    (0, _classCallCheck2["default"])(this, WebGLDebugContext);
  };

  var debugContext = _globals.global.WebGLDebug ? _globals.global.WebGLDebug.makeDebugContext(gl, onGLError, onValidateGLFunc) : gl;
  Object.assign(WebGLDebugContext.prototype, debugContext);
  data.debugContext = debugContext;
  debugContext.debug = true;
  debugContext.gl = gl;
  return debugContext;
}

function getFunctionString(functionName, functionArgs) {
  var args = _globals.global.WebGLDebug.glFunctionArgsToString(functionName, functionArgs);

  args = "".concat(args.slice(0, 100)).concat(args.length > 100 ? '...' : '');
  return "gl.".concat(functionName, "(").concat(args, ")");
}

function onGLError(err, functionName, args) {
  var errorMessage = _globals.global.WebGLDebug.glEnumToString(err);

  var functionArgs = _globals.global.WebGLDebug.glFunctionArgsToString(functionName, args);

  var message = "".concat(errorMessage, " in gl.").concat(functionName, "(").concat(functionArgs, ")");

  _utils.log.error(message)();

  debugger;
}

function onValidateGLFunc(functionName, functionArgs) {
  var functionString;

  if (_utils.log.priority >= 4) {
    functionString = getFunctionString(functionName, functionArgs);

    _utils.log.log(4, functionString)();
  }

  if (_utils.log["break"]) {
    functionString = functionString || getFunctionString(functionName, functionArgs);

    var isBreakpoint = _utils.log["break"] && _utils.log["break"].every(function (breakOn) {
      return functionString.indexOf(breakOn) !== -1;
    });

    if (isBreakpoint) {
      debugger;
    }
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = functionArgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var arg = _step.value;

      if (arg === undefined) {
        functionString = functionString || getFunctionString(functionName, functionArgs);

        if (_utils.log["throw"]) {
          throw new Error("Undefined argument: ".concat(functionString));
        } else {
          _utils.log.error("Undefined argument: ".concat(functionString))();

          _utils.log.error("Undefined argument: ".concat(functionString))();

          debugger;
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}
//# sourceMappingURL=debug-context.js.map