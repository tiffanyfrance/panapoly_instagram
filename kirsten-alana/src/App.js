import React from 'react';
import DeckGL from '@deck.gl/react';
import {ScreenGridLayer} from 'deck.gl';
import {StaticMap} from 'react-map-gl';
import {isWebGL2} from '@luma.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your mapbox access token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoidGlmZnlsb3UiLCJhIjoiY2p2MWRncG5oMXQ4azRkcXhkb2VoZmlpeCJ9.aMZp7-Gw5-goacW4MOnmow';

// Source data CSV
// const DATA_URL =
//   'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json'; // eslint-disable-line

const DATA_URL = 'https://raw.githubusercontent.com/tiffylou/panoply/master/data.json'; // eslint-disable-line

// Initial viewport settings
const INITIAL_VIEW_STATE = {
  longitude: -74.859,
  latitude: 40.4599,
  zoom: 5,
  pitch: 0,
  bearing: 0
};

const colorRange = [
  // [255, 255, 178, 25],
  [254, 217, 118, 85],
  [254, 178, 76, 127],
  [253, 141, 60, 170],
  [240, 59, 32, 212],
  [189, 0, 38, 255]
];

class App extends React.Component {
  _renderLayers() {
    const {data = DATA_URL, cellSize = 8, gpuAggregation = true, aggregation = 'Sum'} = this.props;
    
    return [
      new ScreenGridLayer({
        id: 'grid',
        data,
        getPosition: d => [d.longitude, d.latitude],
        getWeight: d => d.likes_count,
        cellSizePixels: cellSize,
        colorRange,
        // gpuAggregation,
        // aggregation,
        // Enable picking
        pickable: true,
        // Update tooltip
        // onHover: d => setTooltip(d, d.x, d.y)
        onHover: info => setTooltip(info, info.x, info.y)
      })
    ];
  }

  _onInitialized(gl) {
    if (!isWebGL2(gl)) {
      console.warn('GPU aggregation is not supported'); // eslint-disable-line
      if (this.props.disableGPUAggregation) {
        this.props.disableGPUAggregation();
      }
    }
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        initialViewState={INITIAL_VIEW_STATE}
        onWebGLInitialized={this._onInitialized.bind(this)}
        viewState={viewState}
        controller={controller}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            mapStyle="mapbox://styles/mapbox/dark-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }
}

function setTooltip(object, x, y) {
  const el = document.getElementById('tooltip');
  console.log(object)
  if (object) {
    console.log("0", object.object)
    if(object.object) 
      console.log("a", object.object.name)
    el.innerHTML = object.name;
    el.style.display = 'block';
    // el.style.left = x + 'px';
    // el.style.top = y + 'px';
  } else {
    el.style.display = 'none';
  }
}


export default App;
