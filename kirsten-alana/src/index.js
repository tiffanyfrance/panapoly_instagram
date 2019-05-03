import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import logo from './logo.png';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<div><App /><div id="tooltip">
  <a id="close" href=""><div style={{float: 'right', fontSize: '2em'}}>&#10005;</div></a>
  <h1><img src={logo} alt="instagram logo" />Kirsten Alana Instagram Stories</h1>
  <h2>Data Vizualization by Tiffany France</h2>
  <p id="date">April 30, 2019</p>
  <p id="text">
    This site tracks instagram posts using longitude and latitude for Kirsten Alana's instagram account. <a href="https://www.instagram.com/kirstenalana/">Kirsten Alana</a> is a top travel influencer whose mission is to be a "resource for those planning travel".
    The data is gathered using <a href="https://panoply.io/">Panoply</a>, a "fully end-to-end cloud data warehouse and management service." The code uses React with DeckGL, which is built using MapboxGL.
    <br /><br />Use this map like you would use any slippy map: zoom in and out with the mouse; pan by clicking and dragging; hovering/clicking on the red triangles will show the corresponding post.
    <br /><br />Questions about the design or development? <a href="http://tiffanyfrance.com">Get in touch</a> | <a href="https://github.com/tiffylou/panapoly_instagram">Github repo</a>
  </p>
  <svg xmlns="http://www.w3.org/2000/svg" version="1">
    <defs>
      <linearGradient id="e" x1="0" y1="10" x2="460" y2="10" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C8AE6E" offset="0" />
        <stop stopColor="#F11C00" offset="1" />
      </linearGradient>
    </defs>
    <line x1="30" y1="30" x2="375" y2="30" stroke="url(#e)" strokeWidth="8" />
    <line id="vert-line" x1="-202" y1="18" x2="-202" y2="42" stroke="#000" strokeWidth="1" />
    <text y="10" x="202" textAnchor="middle">The total "likes" for all the posts in this dataset is 3,345,005!</text>
  </svg>
  <p id="image-holder"><img src="https://scontent.cdninstagram.com/vp/cc5a24e3f15d7db416513d99d4638de7/5D239255/t51.2885-15/sh0.08/e35/p640x640/20633869_109102839775985_7170899318914678784_n.jpg?_nc_ht=scontent.cdninstagram.com"  alt="featured image" /></p>
</div></div>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
