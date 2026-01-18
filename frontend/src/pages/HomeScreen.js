import React, { useState, useEffect } from 'react';
import '../App.css';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';

function App() {
  const [sportsMarkets, setSportsMarkets] = useState([]);
  const [trendingMarkets, setTrendingMarkets] = useState([]);
  const [politicsMarkets, setPoliticsMarkets] = useState([]);
  const [cryptoMarkets, setCryptoMarkets] = useState([]);
  const [popCultureMarkets, setPopCultureMarkets] = useState([]);
  const [financeMarkets, setFinanceMarkets] = useState([]);
  const [techMarkets, setTechMarkets] = useState([]);
  const [climateMarkets, setClimateMarkets] = useState([]);
  const [earningsMarkets, setEarningsMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState(null);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        console.log("🚀 Fetching all market categories from backend...");

        const [sports, trending, politics, crypto, popculture, finance, tech, climate, earnings] = await Promise.all([
          fetch('http://localhost:5002/api/polymarket/sports?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/trending?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/politics?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/crypto?limit=50').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/popculture?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/finance?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/tech?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/climate?limit=20').then(res => res.json()),
          fetch('http://localhost:5002/api/polymarket/earnings?limit=20').then(res => res.json()),
        ]);

        setSportsMarkets(sports.markets || []);
        setTrendingMarkets(trending.markets || []);
        setPoliticsMarkets(politics.markets || []);
        setCryptoMarkets(crypto.markets || []);
        setPopCultureMarkets(popculture.markets || []);
        setFinanceMarkets(finance.markets || []);
        setTechMarkets(tech.markets || []);
        setClimateMarkets(climate.markets || []);
        setEarningsMarkets(earnings.markets || []);

        console.log("✅ All categories loaded!");
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching markets:", error);
        setLoading(false);
      }
    };

    fetchAllCategories();
  }, []);

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <p style={{ padding: '20px', textAlign: 'center' }}>Loading markets...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <Banner
        market={marketData.featured}
        onMoreInfo={() => setSelectedMarket(marketData.featured)}
      />
      
      <div className="app__rows">
        <MarketRow 
          title="Trending Markets" 
          markets={trendingMarkets.length > 0 ? trendingMarkets : marketData.trending} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Politics" 
          markets={politicsMarkets.length > 0 ? politicsMarkets : marketData.politics} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Crypto" 
          markets={cryptoMarkets.length > 0 ? cryptoMarkets : marketData.crypto} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Sports" 
          markets={sportsMarkets.length > 0 ? sportsMarkets : marketData.sports} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Pop Culture" 
          markets={popCultureMarkets.length > 0 ? popCultureMarkets : marketData.popCulture} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Finance" 
          markets={financeMarkets.length > 0 ? financeMarkets : marketData.business} 
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow 
          title="Tech" 
          markets={techMarkets.length > 0 ? techMarkets : []} 
          onSelectMarket={setSelectedMarket}
        />
       
      </div>
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default App;
