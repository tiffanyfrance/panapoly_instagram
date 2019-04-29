import { formatValue, assert } from '../utils';
export function getDebugTableForUniforms() {
  let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$header = _ref.header,
      header = _ref$header === void 0 ? 'Uniforms' : _ref$header,
      program = _ref.program,
      uniforms = _ref.uniforms,
      _ref$undefinedOnly = _ref.undefinedOnly,
      undefinedOnly = _ref$undefinedOnly === void 0 ? false : _ref$undefinedOnly;

  assert(program);
  const SHADER_MODULE_UNIFORM_REGEXP = '.*_.*';
  const PROJECT_MODULE_UNIFORM_REGEXP = '.*Matrix';
  const uniformLocations = program._uniformSetters;
  const table = {};
  const uniformNames = Object.keys(uniformLocations).sort();
  let count = 0;

  for (const uniformName of uniformNames) {
    if (!uniformName.match(SHADER_MODULE_UNIFORM_REGEXP) && !uniformName.match(PROJECT_MODULE_UNIFORM_REGEXP)) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  for (const uniformName of uniformNames) {
    if (uniformName.match(PROJECT_MODULE_UNIFORM_REGEXP)) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  for (const uniformName of uniformNames) {
    if (!table[uniformName]) {
      if (addUniformToTable({
        table,
        header,
        uniforms,
        uniformName,
        undefinedOnly
      })) {
        count++;
      }
    }
  }

  let unusedCount = 0;
  const unusedTable = {};

  if (!undefinedOnly) {
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];

      if (!table[uniformName]) {
        unusedCount++;
        unusedTable[uniformName] = {
          Type: "NOT USED: ".concat(uniform),
          [header]: formatValue(uniform)
        };
      }
    }
  }

  return {
    table,
    count,
    unusedTable,
    unusedCount
  };
}

function addUniformToTable(_ref2) {
  let table = _ref2.table,
      header = _ref2.header,
      uniforms = _ref2.uniforms,
      uniformName = _ref2.uniformName,
      undefinedOnly = _ref2.undefinedOnly;
  const value = uniforms[uniformName];
  const isDefined = isUniformDefined(value);

  if (!undefinedOnly || !isDefined) {
    table[uniformName] = {
      [header]: isDefined ? formatValue(value) : 'N/A',
      'Uniform Type': isDefined ? value : 'NOT PROVIDED'
    };
    return true;
  }

  return false;
}

function isUniformDefined(value) {
  return value !== undefined && value !== null;
}
//# sourceMappingURL=debug-uniforms.js.map