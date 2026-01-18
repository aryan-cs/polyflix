import React, { useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './MyWatchlists.css';

function MyWatchlists() {
  const [selectedMarket, setSelectedMarket] = useState(null);

  return (
    <div className="myWatchlists">
        <div className="myWatchlists__header">
            <h2>My Watchlists</h2>
        </div>
      <div className="myWatchlists__rows">
        <MarketRow
          title="My Politics Picks"
          markets={marketData.politics}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Crypto Gems"
          markets={marketData.crypto}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Upcoming Sports"
          markets={marketData.sports}
          onSelectMarket={setSelectedMarket}
        />
      </div>
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default MyWatchlists;
