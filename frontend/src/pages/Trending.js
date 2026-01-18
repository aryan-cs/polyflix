import React, { useEffect, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './Trending.css';

function Trending() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [trendingMarkets, setTrendingMarkets] = useState(marketData.trending);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(
          'http://localhost:5002/api/polymarket/trending?limit=20'
        );
        const data = await response.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          setTrendingMarkets(data.markets);
        }
      } catch (error) {
        console.error('❌ Error fetching trending markets:', error);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="trending">
      <div className="trending__header">
        <h2>Trending</h2>
      </div>
      <div className="trending__rows">
        <MarketRow
          title="Trending Markets"
          markets={trendingMarkets}
          onSelectMarket={setSelectedMarket}
        />
      </div>
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default Trending;

