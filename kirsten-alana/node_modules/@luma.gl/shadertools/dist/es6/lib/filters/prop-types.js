import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
const TYPE_DEFINITIONS = {
  boolean: {
    validate(value, propType) {
      return true;
    }

  },
  number: {
    validateType(value, propType) {
      return 'value' in propType && (!('max' in propType) || Number.isFinite(propType.max)) && (!('min' in propType) || Number.isFinite(propType.min));
    },

    validate(value, propType) {
      return Number.isFinite(value) && (!('max' in propType) || value <= propType.max) && (!('min' in propType) || value >= propType.min);
    }

  }
};
export function parsePropTypes(propDefs) {
  const propTypes = {};
  const defaultProps = {};

  for (const _ref of Object.entries(propDefs)) {
    var _ref2 = _slicedToArray(_ref, 2);

    const propName = _ref2[0];
    const propDef = _ref2[1];
    const propType = parsePropType(propName, propDef);
    propTypes[propName] = propType;
    defaultProps[propName] = propType.value;
  }

  return {
    propTypes,
    defaultProps
  };
}

function parsePropType(name, propDef) {
  switch (getTypeOf(propDef)) {
    case 'object':
      propDef = normalizePropType(name, propDef);
      return parsePropDefinition(propDef);

    case 'array':
      return guessArrayType(name, propDef);

    case 'boolean':
      return {
        name,
        type: 'boolean',
        value: propDef
      };

    case 'number':
      return guessNumberType(name, propDef);

    case 'function':
      return {
        name,
        type: 'function',
        value: propDef
      };

    default:
      return {
        name,
        type: 'unknown',
        value: propDef
      };
  }
}

function guessArrayType(name, array) {
  if (/color/i.test(name) && (array.length === 3 || array.length === 4)) {
    return {
      name,
      type: 'color',
      value: array
    };
  }

  return {
    name,
    type: 'array',
    value: array
  };
}

function normalizePropType(name, propDef) {
  if (!('type' in propDef)) {
    if (!('value' in propDef)) {
      return {
        name,
        type: 'object',
        value: propDef
      };
    }

    return Object.assign({
      name,
      type: getTypeOf(propDef.value)
    }, propDef);
  }

  return Object.assign({
    name
  }, propDef);
}

function parsePropDefinition(propDef) {
  const type = propDef.type;
  const typeDefinition = TYPE_DEFINITIONS[type] || {};
  const typeValidator = typeDefinition.typeValidator;

  if (typeValidator) {}

  return propDef;
}

function guessNumberType(name, value) {
  const isKnownProp = /radius|scale|width|height|pixel|size|miter/i.test(name) && /^((?!scale).)*$/.test(name);
  const max = isKnownProp ? 100 : 1;
  const min = 0;
  return {
    name,
    type: 'number',
    max: Math.max(value, max),
    min: Math.min(value, min),
    value
  };
}

function getTypeOf(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
}
//# sourceMappingURL=prop-types.js.map