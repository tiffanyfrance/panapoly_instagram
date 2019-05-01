import React from 'react';
import DeckGL from '@deck.gl/react';
import {IconLayer} from '@deck.gl/layers';
import {StaticMap} from 'react-map-gl';
import {isWebGL2} from '@luma.gl/core';
import moment from 'moment'
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

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 15, height: 15}
};

class App extends React.Component {
  _renderLayers() {
    const {data = DATA_URL} = this.props;
    
    return [
      new IconLayer({
        id: 'grid',
        data,
        iconAtlas: 'square.png',
        iconMapping: ICON_MAPPING,
        getIcon: d => 'marker',
        sizeScale: 2,
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

    let x = 30 + ((d.likes_count / 8000) * 345);

    el.innerHTML = 
    `
      <h1><img src="logo.png" alt="instagram logo" />Kirsten Alana Instagram Stories</h1>
      <h2>${d.name}</h2>
      <p>${moment(d.created_time, "YYYY-MM-DD HH:mm:ss").format("MMMM D, YYYY")}</p>
      <p>long, lat: ${d.latitude}, ${d.longitude}</p>
      <p>${d.text}</p>
      <p><a href="${d.link}" target="_blank" rel="noopener noreferrer">see more...</a></p>
      <svg xmlns="http://www.w3.org/2000/svg" version="1">
        <defs>
          <linearGradient id="e" x1="0" y1="10" x2="460" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C8AE6E" offset="0" />
            <stop stopColor="#F11C00" offset="1" />
          </linearGradient>
        </defs>
        <line x1="30" y1="30" x2="375" y2="30" stroke="url(#e)" strokeWidth="8" />
        <line x1="${x}" y1="18" x2="${x}" y2="42" stroke="#000" strokeWidth="1" />
        <text y="10" x="${x}" textAnchor="middle">${d.likes_count} likes</text>
      </svg>
      <img src="${d.url}" alt="featured image" />
    `;
    el.style.display = 'block';
  }
}


export default App;
