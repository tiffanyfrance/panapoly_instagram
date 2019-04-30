import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import logo from './logo.png';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<div><App /><div id="tooltip" style={{display: 'none'}}>
  <h1><img src={logo} alt="instagram logo" />Kirsten Alana Instagram Stories</h1>
  <h2>Seljalandsfoss</h2>
  <p>long, lat: -19.992394645985, 63.615887707572</p>
  <p>
    We set off early from Reyjkavik, deciding the landscapes called to us more than the city itself (and also knowing we'll be back in town at the end of this adventure anyway). The Ring Road didn't disappoint on day one; from 10 minutes outside the city till the minute we quit after 9 PM in Vik, and even with intermittent rain and gray storm clouds -- it turns out all we've seen and heard about how beautiful Iceland is, is indeed 100% true. This is the oft-photographed Seljalandsfoss Waterfall. 📷
  </p>
  <p><a href="https://www.instagram.com/p/3heCbxFyZ9/" target="_blank" rel="noopener noreferrer">see more...</a></p>
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
  <img src="https://scontent.cdninstagram.com/vp/ab4d4e4140decc48a9f627c84e2086d1/5D1FE67B/t51.2885-15/e15/11386524_996213267068896_318014119_n.jpg?_nc_ht=scontent.cdninstagram.com" alt="featured image" />
</div></div>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
