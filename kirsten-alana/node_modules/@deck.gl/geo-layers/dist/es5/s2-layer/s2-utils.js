"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getS2Polygon = getS2Polygon;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _s2Geometry = require("s2-geometry");

function getLevelFromToken(token) {
  var lastHex = token.substr(token.length - 1);
  var level = 2 * (token.length - 1) - ((lastHex & 1) === 0);
  return level;
}

function getIdFromToken(token) {
  var paddedToken = token.padEnd(16, '0');
  return String(parseInt(paddedToken, 16));
}

var RADIAN_TO_DEGREE = 180 / Math.PI;
var MAX_RESOLUTION = 100;

function XYZToLngLat(_ref) {
  var _ref2 = (0, _slicedToArray2.default)(_ref, 3),
      x = _ref2[0],
      y = _ref2[1],
      z = _ref2[2];

  var lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  var lng = Math.atan2(y, x);
  return [lng * RADIAN_TO_DEGREE, lat * RADIAN_TO_DEGREE];
}

function getGeoBounds(_ref3) {
  var face = _ref3.face,
      ij = _ref3.ij,
      level = _ref3.level;
  var result = [];
  var offsets = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
  var resolution = Math.max(1, MAX_RESOLUTION * Math.pow(2, -level));

  for (var i = 0; i < 4; i++) {
    var offset = offsets[i].slice(0);
    var nextOffset = offsets[i + 1];
    var stepI = (nextOffset[0] - offset[0]) / resolution;
    var stepJ = (nextOffset[1] - offset[1]) / resolution;

    for (var j = 0; j < resolution; j++) {
      offset[0] += stepI;
      offset[1] += stepJ;

      var st = _s2Geometry.S2.IJToST(ij, level, offset);

      var uv = _s2Geometry.S2.STToUV(st);

      var xyz = _s2Geometry.S2.FaceUVToXYZ(face, uv);

      result.push(XYZToLngLat(xyz));
    }
  }

  return result;
}

function getS2Polygon(token) {
  var id = getIdFromToken(token);
  var level = getLevelFromToken(token);

  var s2cell = _s2Geometry.S2.S2Cell.FromLatLng(_s2Geometry.S2.idToLatLng(id), level);

  return getGeoBounds(s2cell);
}
//# sourceMappingURL=s2-utils.js.map