import React from 'react';
import DeckGL from '@deck.gl/react';
import {IconLayer} from '@deck.gl/layers';
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

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 50, height: 50}
};

class App extends React.Component {
  _renderLayers() {
    const {data = DATA_URL, cellSize = 8, gpuAggregation = true, aggregation = 'Sum'} = this.props;
    
    return [
      new IconLayer({
        id: 'grid',
        data,
        iconAtlas: 'logo.png',
        iconMapping: ICON_MAPPING,
        getIcon: d => 'marker',
        sizeScale: 5,
        getSize: d => 5,
        getPosition: d => [d.longitude, d.latitude],
        pickable: true,
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

function setTooltip(info, x, y) {
  const el = document.getElementById('tooltip');

  if (info && info.object) {
    let d = info.object;

    el.innerHTML = 
    `
      <h1><img src="logo.png" alt="instagram logo" />Kirsten Alana Instagram Stories</h1>
      <h2>${d.name}</h2>
      <p>long, lat: ${d.latitude}, ${d.longitude}</p>
      <p>
        We set off early from Reyjkavik, deciding the landscapes called to us more than the city itself (and also knowing we'll be back in town at the end of this adventure anyway). The Ring Road didn't disappoint on day one; from 10 minutes outside the city till the minute we quit after 9 PM in Vik, and even with intermittent rain and gray storm clouds -- it turns out all we've seen and heard about how beautiful Iceland is, is indeed 100% true. This is the oft-photographed Seljalandsfoss Waterfall. 📷
      </p>
      <p><a href="${d.link}" target="_blank" rel="noopener noreferrer">see more...</a></p>
      <svg xmlns="http://www.w3.org/2000/svg" version="1">
        <defs>
          <linearGradient id="e" x1="0" y1="10" x2="460" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C8AE6E" offset="0" />
            <stop stopColor="#F11C00" offset="1" />
          </linearGradient>
        </defs>
        <line x1="30" y1="30" x2="375" y2="30" stroke="url(#e)" strokeWidth="8" />
        <line x1="260" y1="18" x2="260" y2="42" stroke="#000" strokeWidth="1" />
        <text y="10" x="260" textAnchor="middle">2,000 likes</text>
      </svg>
      <img src="${d.url}" alt="featured image" />
    `;
    el.style.display = 'block';
  }
}


export default App;
