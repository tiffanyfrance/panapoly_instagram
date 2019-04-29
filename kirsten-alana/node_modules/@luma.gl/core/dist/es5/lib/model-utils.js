"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuffersFromGeometry = getBuffersFromGeometry;
exports.inferAttributeAccessor = inferAttributeAccessor;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _webgl = require("@luma.gl/webgl");

var _utils = require("../utils");

var GLTF_TO_LUMA_ATTRIBUTE_MAP = {
  POSITION: 'positions',
  NORMAL: 'normals',
  COLOR_0: 'colors',
  TEXCOORD_0: 'texCoords',
  TEXCOORD_1: 'texCoords1',
  TEXCOORD_2: 'texCoords2'
};

function getBuffersFromGeometry(gl, geometry, options) {
  var buffers = {};

  for (var name in geometry.attributes) {
    var attribute = geometry.attributes[name];
    var remappedName = mapAttributeName(name, options);

    if (attribute.constant) {
      buffers[remappedName] = attribute.value;
    } else {
      var typedArray = attribute.value;
      var accessor = (0, _objectSpread2["default"])({}, attribute);
      delete accessor.value;
      buffers[remappedName] = [new _webgl.Buffer(gl, typedArray), accessor];
      inferAttributeAccessor(name, accessor);
    }
  }

  if (geometry.indices) {
    buffers.indices = new _webgl.Buffer(gl, {
      data: geometry.indices.value || geometry.indices,
      target: 34963
    });
  }

  return buffers;
}

function mapAttributeName(name, options) {
  var _ref = options || {},
      _ref$attributeMap = _ref.attributeMap,
      attributeMap = _ref$attributeMap === void 0 ? GLTF_TO_LUMA_ATTRIBUTE_MAP : _ref$attributeMap;

  return attributeMap && attributeMap[name] || name;
}

function inferAttributeAccessor(attributeName, attribute) {
  var category;

  switch (attributeName) {
    case 'indices':
      category = category || 'indices';
      break;

    case 'texCoords':
    case 'texCoord1':
    case 'texCoord2':
    case 'texCoord3':
      category = 'uvs';
      break;

    case 'vertices':
    case 'positions':
    case 'normals':
    case 'pickingColors':
      category = 'vectors';
      break;

    default:
  }

  switch (category) {
    case 'vectors':
      attribute.size = attribute.size || 3;
      break;

    case 'uvs':
      attribute.size = attribute.size || 2;
      break;

    case 'indices':
      attribute.size = attribute.size || 1;
      attribute.isIndexed = attribute.isIndexed === undefined ? true : attribute.isIndexed;
      (0, _utils.assert)(attribute.value instanceof Uint16Array || attribute.value instanceof Uint32Array, 'attribute array for "indices" must be of integer type');
      break;

    default:
  }

  (0, _utils.assert)(Number.isFinite(attribute.size), "attribute ".concat(attributeName, " needs size"));
}
//# sourceMappingURL=model-utils.js.map