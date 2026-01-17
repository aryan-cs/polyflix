import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import MarketRow from './components/MarketRow';
import { marketData } from './data/mockData';

function App() {
  const [sportsMarkets, setSportsMarkets] = useState([]);
  const [trendingMarkets, setTrendingMarkets] = useState([]);
  const [politicsMarkets, setPoliticsMarkets] = useState([]);
  const [cryptoMarkets, setCryptoMarkets] = useState([]);
  const [popCultureMarkets, setPopCultureMarkets] = useState([]);
  const [financeMarkets, setFinanceMarkets] = useState([]);

  useEffect(() => {
  fetch('http://localhost:5001/api/polymarket/sports?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Sports markets:", markets);
      setSportsMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));

  fetch('http://localhost:5001/api/polymarket/trending?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Trending markets:", markets);
      setTrendingMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));

  fetch('http://localhost:5001/api/polymarket/politics?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Politics markets:", markets);
      setPoliticsMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));

  fetch('http://localhost:5001/api/polymarket/crypto?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Crypto markets:", markets);
      setCryptoMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));

  fetch('http://localhost:5001/api/polymarket/popculture?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Pop Culture markets:", markets);
      setPopCultureMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));

  fetch('http://localhost:5001/api/polymarket/finance?limit=10')
    .then(res => res.json())
    .then((markets) => {
      console.log("Finance markets:", markets);
      setFinanceMarkets(markets);
    })
    .catch(err => console.error("❌ Error:", err));
}, []);

  return (
    <div className="app">
      <Navbar />
      <Banner market={marketData.featured} />
      
      <div className="app__rows">
        <MarketRow title="Trending Markets" markets={trendingMarkets.length > 0 ? trendingMarkets : marketData.trending} />
        <MarketRow title="Politics" markets={politicsMarkets.length > 0 ? politicsMarkets : marketData.politics} />
        <MarketRow title="Crypto" markets={cryptoMarkets.length > 0 ? cryptoMarkets : marketData.crypto} />
        <MarketRow title="Sports" markets={sportsMarkets.length > 0 ? sportsMarkets : marketData.sports} />
        <MarketRow title="Pop Culture" markets={popCultureMarkets.length > 0 ? popCultureMarkets : marketData.popCulture} />
        <MarketRow title="Finance" markets={financeMarkets.length > 0 ? financeMarkets : marketData.business} />
      </div>
    </div>
  );
}

export default App;