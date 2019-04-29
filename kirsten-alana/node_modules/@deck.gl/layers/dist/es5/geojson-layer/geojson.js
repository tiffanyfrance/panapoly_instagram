"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assert;
exports.getGeojsonFeatures = getGeojsonFeatures;
exports.separateGeojsonFeatures = separateGeojsonFeatures;
exports.unwrapSourceFeature = unwrapSourceFeature;
exports.unwrapSourceFeatureIndex = unwrapSourceFeatureIndex;

function assert(condition, message) {
  if (!condition) {
    throw new Error("deck.gl: ".concat(message));
  }
}

function getGeojsonFeatures(geojson) {
  if (Array.isArray(geojson)) {
    return geojson;
  }

  assert(geojson.type, 'GeoJSON does not have type');

  switch (geojson.type) {
    case 'Feature':
      return [geojson];

    case 'FeatureCollection':
      assert(Array.isArray(geojson.features), 'GeoJSON does not have features array');
      return geojson.features;

    default:
      return [{
        geometry: geojson
      }];
  }
}

function separateGeojsonFeatures(features) {
  var separated = {
    pointFeatures: [],
    lineFeatures: [],
    polygonFeatures: [],
    polygonOutlineFeatures: []
  };

  for (var featureIndex = 0; featureIndex < features.length; featureIndex++) {
    var feature = features[featureIndex];
    assert(feature && feature.geometry, 'GeoJSON does not have geometry');
    var geometry = feature.geometry;
    var sourceFeature = {
      feature: feature,
      index: featureIndex
    };

    if (geometry.type === 'GeometryCollection') {
      assert(Array.isArray(geometry.geometries), 'GeoJSON does not have geometries array');
      var geometries = geometry.geometries;

      for (var i = 0; i < geometries.length; i++) {
        var subGeometry = geometries[i];
        separateGeometry(subGeometry, separated, sourceFeature);
      }
    } else {
      separateGeometry(geometry, separated, sourceFeature);
    }
  }

  return separated;
}

function separateGeometry(geometry, separated, sourceFeature) {
  var type = geometry.type,
      coordinates = geometry.coordinates;
  var pointFeatures = separated.pointFeatures,
      lineFeatures = separated.lineFeatures,
      polygonFeatures = separated.polygonFeatures,
      polygonOutlineFeatures = separated.polygonOutlineFeatures;
  checkCoordinates(type, coordinates);

  switch (type) {
    case 'Point':
      pointFeatures.push({
        geometry: geometry,
        sourceFeature: sourceFeature
      });
      break;

    case 'MultiPoint':
      coordinates.forEach(function (point) {
        pointFeatures.push({
          geometry: {
            type: 'Point',
            coordinates: point
          },
          sourceFeature: sourceFeature
        });
      });
      break;

    case 'LineString':
      lineFeatures.push({
        geometry: geometry,
        sourceFeature: sourceFeature
      });
      break;

    case 'MultiLineString':
      coordinates.forEach(function (path) {
        lineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: path
          },
          sourceFeature: sourceFeature
        });
      });
      break;

    case 'Polygon':
      polygonFeatures.push({
        geometry: geometry,
        sourceFeature: sourceFeature
      });
      coordinates.forEach(function (path) {
        polygonOutlineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: path
          },
          sourceFeature: sourceFeature
        });
      });
      break;

    case 'MultiPolygon':
      coordinates.forEach(function (polygon) {
        polygonFeatures.push({
          geometry: {
            type: 'Polygon',
            coordinates: polygon
          },
          sourceFeature: sourceFeature
        });
        polygon.forEach(function (path) {
          polygonOutlineFeatures.push({
            geometry: {
              type: 'LineString',
              coordinates: path
            },
            sourceFeature: sourceFeature
          });
        });
      });
      break;

    default:
  }
}

function unwrapSourceFeature(wrappedFeature) {
  return wrappedFeature.sourceFeature.feature;
}

function unwrapSourceFeatureIndex(wrappedFeature) {
  return wrappedFeature.sourceFeature.index;
}

var COORDINATE_NEST_LEVEL = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4
};

function checkCoordinates(type, coordinates) {
  var nestLevel = COORDINATE_NEST_LEVEL[type];
  assert(nestLevel, "Unknown GeoJSON type ".concat(type));

  while (coordinates && --nestLevel > 0) {
    coordinates = coordinates[0];
  }

  assert(coordinates && Number.isFinite(coordinates[0]), "".concat(type, " coordinates are malformed"));
}
//# sourceMappingURL=geojson.js.map