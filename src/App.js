import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import MarketRow from './components/MarketRow';
import { marketData } from './data/mockData';

function App() {
  const [sportsMarkets, setSportsMarkets] = useState([]);
  const [trendingMarkets, setTrendingMarkets] = useState([]);

  useEffect(() => {
    // Fetch sports markets
    fetch('http://localhost:5001/api/polymarket/sports?limit=10')
      .then(res => res.json())
      .then((markets) => {
        console.log("Sports markets fetched:", markets);
        setSportsMarkets(markets);
      })
      .catch(err => console.error("❌ Error fetching sports:", err));

    // Fetch trending markets
    fetch('http://localhost:5001/api/polymarket/trending?limit=10')
      .then(res => res.json())
      .then((markets) => {
        console.log("Trending markets fetched:", markets);
        setTrendingMarkets(markets);
      })
      .catch(err => console.error("❌ Error fetching trending:", err));
  }, []);

  return (
    <div className="app">
      <Navbar />
      <Banner market={marketData.featured} />
      
      <div className="app__rows">
        <MarketRow title="Trending Markets" markets={trendingMarkets.length > 0 ? trendingMarkets : marketData.trending} />
        <MarketRow title="Politics" markets={marketData.politics} />
        <MarketRow title="Crypto" markets={marketData.crypto} />
        <MarketRow title="Sports" markets={sportsMarkets.length > 0 ? sportsMarkets : marketData.sports} />
        <MarketRow title="Pop Culture" markets={marketData.popCulture} />
        <MarketRow title="Business" markets={marketData.business} />
      </div>
    </div>
  );
}

export default App;