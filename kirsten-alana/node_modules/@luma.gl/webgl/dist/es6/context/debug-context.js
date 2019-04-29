import { global } from '../utils/globals';
import { log } from '../utils';

function getContextData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

export function enableDebug(debug) {}
export function makeDebugContext(gl) {
  let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? true : _ref$debug;

  if (gl === null) {
    return null;
  }

  return debug ? getDebugContext(gl) : getRealContext(gl);
}
export function getRealContext(gl) {
  if (gl === null) {
    return null;
  }

  const data = getContextData(gl);
  return data.realContext ? data.realContext : gl;
}
export function getDebugContext(gl) {
  if (gl === null) {
    return null;
  }

  if (!global.WebGLDebug) {
    console.warn('WebGL debug mode not activated. import "@luma.gl/debug" to enable.')();
    return gl;
  }

  const data = getContextData(gl);

  if (data.realContext) {
    return gl;
  }

  if (data.debugContext) {
    return data.debugContext;
  }

  class WebGLDebugContext {}

  const debugContext = global.WebGLDebug ? global.WebGLDebug.makeDebugContext(gl, onGLError, onValidateGLFunc) : gl;
  Object.assign(WebGLDebugContext.prototype, debugContext);
  data.debugContext = debugContext;
  debugContext.debug = true;
  debugContext.gl = gl;
  return debugContext;
}

function getFunctionString(functionName, functionArgs) {
  let args = global.WebGLDebug.glFunctionArgsToString(functionName, functionArgs);
  args = "".concat(args.slice(0, 100)).concat(args.length > 100 ? '...' : '');
  return "gl.".concat(functionName, "(").concat(args, ")");
}

function onGLError(err, functionName, args) {
  const errorMessage = global.WebGLDebug.glEnumToString(err);
  const functionArgs = global.WebGLDebug.glFunctionArgsToString(functionName, args);
  const message = "".concat(errorMessage, " in gl.").concat(functionName, "(").concat(functionArgs, ")");
  log.error(message)();
  debugger;
}

function onValidateGLFunc(functionName, functionArgs) {
  let functionString;

  if (log.priority >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    log.log(4, functionString)();
  }

  if (log.break) {
    functionString = functionString || getFunctionString(functionName, functionArgs);
    const isBreakpoint = log.break && log.break.every(breakOn => functionString.indexOf(breakOn) !== -1);

    if (isBreakpoint) {
      debugger;
    }
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString || getFunctionString(functionName, functionArgs);

      if (log.throw) {
        throw new Error("Undefined argument: ".concat(functionString));
      } else {
        log.error("Undefined argument: ".concat(functionString))();
        log.error("Undefined argument: ".concat(functionString))();
        debugger;
      }
    }
  }
}
//# sourceMappingURL=debug-context.js.map