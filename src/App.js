import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import MarketRow from './components/MarketRow';
import { marketData } from './data/mockData';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Banner market={marketData.featured} />
      
      <div className="app__rows">
        <MarketRow title="Trending Markets" markets={marketData.trending} />
        <MarketRow title="Politics" markets={marketData.politics} />
        <MarketRow title="Crypto" markets={marketData.crypto} />
        <MarketRow title="Sports" markets={marketData.sports} />
        <MarketRow title="Pop Culture" markets={marketData.popCulture} />
        <MarketRow title="Business" markets={marketData.business} />
      </div>
    </div>
  );
}

export default App;
