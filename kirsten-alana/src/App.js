import React from 'react';
import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { isWebGL2 } from '@luma.gl/core';
import moment from 'moment';
import $ from "jquery";
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your mapbox access token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoidGlmZnlsb3UiLCJhIjoiY2p2MWRncG5oMXQ4azRkcXhkb2VoZmlpeCJ9.aMZp7-Gw5-goacW4MOnmow';

// Source data CSV
// const DATA_URL =
//   'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/screen-grid/uber-pickup-locations.json'; // eslint-disable-line

const DATA_URL = 'https://raw.githubusercontent.com/tiffylou/panoply/master/data.json'; // eslint-disable-line

// Initial viewport settings
const INITIAL_VIEW_STATE = {
  longitude: -15.204279623,
  latitude: 64.250074554,
  zoom: 6.5,
  pitch: 0,
  bearing: 0
};

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 15, height: 15 }
};

class App extends React.Component {

  _renderLayers() {
    const { data = DATA_URL } = this.props;

    return [
      new IconLayer({
        id: 'grid',
        data,
        iconAtlas: 'square1.png',
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
    const { viewState, controller = true, baseMap = true } = this.props;

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
            mapStyle="mapbox://styles/mapbox/light-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }

  componentDidMount() {
    $('#close').click(() => {
      $('#tooltip').hide();
      return false;
    })
  }
}

function setTooltip(info, x, y) {
  if (info && info.object) {
    let d = info.object;

    let x = 30 + ((d.likes_count / 8000) * 345);

    $('#tooltip h2').html(d.name);
    $('#tooltip #date').html(moment(d.created_time, "YYYY-MM-DD HH:mm:ss").format("MMMM D, YYYY"));
    // $('#tooltip #location').html(`long, lat: ${d.latitude}, ${d.longitude}`);
    $('#tooltip #text').html(d.text);
    $('#tooltip #text').append(`... <a id="see-more" href="${d.link}" target="_blank" rel="noopener noreferrer">[see more]</a>`);
    $('#tooltip #image-holder').html(`<img src="${d.url}" alt="featured image" />`);
    $('#tooltip svg #vert-line').attr('x1', x);
    $('#tooltip svg #vert-line').attr('x2', x);
    $('#tooltip svg text').html(`${d.likes_count} likes`);
    $('#tooltip svg text').attr('x', x);
    $('#tooltip').show();
  }
}


export default App;
