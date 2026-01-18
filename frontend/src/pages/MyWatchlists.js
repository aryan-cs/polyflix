import React from 'react';
import MarketRow from '../components/MarketRow';
import { marketData } from '../data/mockData';
import './MyWatchlists.css';

function MyWatchlists() {
  return (
    <div className="myWatchlists">
        <div className="myWatchlists__header">
            <h2>My Watchlists</h2>
        </div>
      <div className="myWatchlists__rows">
        <MarketRow title="My Politics Picks" markets={marketData.politics} />
        <MarketRow title="Crypto Gems" markets={marketData.crypto} />
        <MarketRow title="Upcoming Sports" markets={marketData.sports} />
      </div>
    </div>
  );
}

export default MyWatchlists;
