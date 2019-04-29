import _typeof from "@babel/runtime/helpers/esm/typeof";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
var TYPE_DEFINITIONS = {
  "boolean": {
    validate: function validate(value, propType) {
      return true;
    }
  },
  number: {
    validateType: function validateType(value, propType) {
      return 'value' in propType && (!('max' in propType) || Number.isFinite(propType.max)) && (!('min' in propType) || Number.isFinite(propType.min));
    },
    validate: function validate(value, propType) {
      return Number.isFinite(value) && (!('max' in propType) || value <= propType.max) && (!('min' in propType) || value >= propType.min);
    }
  }
};
export function parsePropTypes(propDefs) {
  var propTypes = {};
  var defaultProps = {};

  for (var _i = 0, _Object$entries = Object.entries(propDefs); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        propName = _Object$entries$_i[0],
        propDef = _Object$entries$_i[1];

    var propType = parsePropType(propName, propDef);
    propTypes[propName] = propType;
    defaultProps[propName] = propType.value;
  }

  return {
    propTypes: propTypes,
    defaultProps: defaultProps
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
        name: name,
        type: 'boolean',
        value: propDef
      };

    case 'number':
      return guessNumberType(name, propDef);

    case 'function':
      return {
        name: name,
        type: 'function',
        value: propDef
      };

    default:
      return {
        name: name,
        type: 'unknown',
        value: propDef
      };
  }
}

function guessArrayType(name, array) {
  if (/color/i.test(name) && (array.length === 3 || array.length === 4)) {
    return {
      name: name,
      type: 'color',
      value: array
    };
  }

  return {
    name: name,
    type: 'array',
    value: array
  };
}

function normalizePropType(name, propDef) {
  if (!('type' in propDef)) {
    if (!('value' in propDef)) {
      return {
        name: name,
        type: 'object',
        value: propDef
      };
    }

    return Object.assign({
      name: name,
      type: getTypeOf(propDef.value)
    }, propDef);
  }

  return Object.assign({
    name: name
  }, propDef);
}

function parsePropDefinition(propDef) {
  var type = propDef.type;
  var typeDefinition = TYPE_DEFINITIONS[type] || {};
  var typeValidator = typeDefinition.typeValidator;

  if (typeValidator) {}

  return propDef;
}

function guessNumberType(name, value) {
  var isKnownProp = /radius|scale|width|height|pixel|size|miter/i.test(name) && /^((?!scale).)*$/.test(name);
  var max = isKnownProp ? 100 : 1;
  var min = 0;
  return {
    name: name,
    type: 'number',
    max: Math.max(value, max),
    min: Math.min(value, min),
    value: value
  };
}

function getTypeOf(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return _typeof(value);
}
//# sourceMappingURL=prop-types.js.map