import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import logo from './logo.png';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<div><App /><div id="tooltip">
  <a id="close" href=""><div style={{float: 'right', fontSize: '2em'}}>&#10005;</div></a>
  <h1><img src={logo} alt="instagram logo" />Kirsten Alana Instagram Stories</h1>
  <h2>Data Vizualization by <a href="http://tiffanyfrance.com">Tiffany France</a></h2>
  <p id="date">&nbsp;</p>
  <p id="location"></p>
  <p id="text">
    This page shows instagram posts using longitude and latitude for Kirsten Alana's instagram account. <a href="https://www.instagram.com/kirstenalana/">Kirsten Alana</a> is a top travel influencer with the goal "to be a resource for those planning travel". 
    <br /><br />The data is gathered using <a href="https://panoply.io/">Panoply</a>, a "fully end-to-end cloud data warehouse and management service."
  </p>
  <p><a id="see-more" href="https://www.instagram.com/p/3heCbxFyZ9/" target="_blank" rel="noopener noreferrer">see more...</a></p>
  <svg xmlns="http://www.w3.org/2000/svg" version="1">
    <defs>
      <linearGradient id="e" x1="0" y1="10" x2="460" y2="10" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C8AE6E" offset="0" />
        <stop stopColor="#F11C00" offset="1" />
      </linearGradient>
    </defs>
    <line x1="30" y1="30" x2="375" y2="30" stroke="url(#e)" strokeWidth="8" />
    <line id="vert-line" x1="-202" y1="18" x2="-202" y2="42" stroke="#000" strokeWidth="1" />
    <text y="10" x="202" textAnchor="middle">3,345,005 total likes</text>
  </svg>
  <img id="avengers" src="https://scontent.cdninstagram.com/vp/ab4d4e4140decc48a9f627c84e2086d1/5D1FE67B/t51.2885-15/e15/11386524_996213267068896_318014119_n.jpg?_nc_ht=scontent.cdninstagram.com" alt="featured image" />
</div></div>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
