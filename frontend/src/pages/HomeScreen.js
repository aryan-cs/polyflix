import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import { getMarketImage } from '../utils/imageMapper';

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
  const [featuredMarket, setFeaturedMarket] = useState(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double-fetch in React StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

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

        const enrich = (markets) => (markets || []).map(m => {
          // Map backend fields to frontend expectations
          const title = m.title || m.question || "Untitled Market";
          const image = m.image || m.icon; // Polymarket often returns 'icon'
          
          return { 
            ...m, 
            title,
            image: getMarketImage({ ...m, title, image }) 
          };
        });

        const sportsEnriched = enrich(sports.markets);
        const trendingEnriched = enrich(trending.markets);
        const politicsEnriched = enrich(politics.markets);
        const cryptoEnriched = enrich(crypto.markets);
        const popCultureEnriched = enrich(popculture.markets);
        const financeEnriched = enrich(finance.markets);

        setSportsMarkets(sportsEnriched);
        setTrendingMarkets(trendingEnriched);
        setPoliticsMarkets(politicsEnriched);
        setCryptoMarkets(cryptoEnriched);
        setPopCultureMarkets(popCultureEnriched);
        setFinanceMarkets(financeEnriched);
        setTechMarkets(enrich(tech.markets));
        setClimateMarkets(enrich(climate.markets));
        setEarningsMarkets(enrich(earnings.markets));

        // Pick a random featured market from the top categories
        const featuredPool = [
           ...trendingEnriched, 
           ...politicsEnriched, 
           ...cryptoEnriched, 
           ...sportsEnriched
        ].filter(m => m.image); // Prefer ones that might have images

        if (featuredPool.length > 0) {
          const randomMarket = featuredPool[Math.floor(Math.random() * featuredPool.length)];
          setFeaturedMarket(randomMarket);
        } else {
          setFeaturedMarket(marketData.featured);
        }

        console.log("✅ All categories loaded!");
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching markets:", error);
        setFeaturedMarket(marketData.featured);
        setLoading(false);
      }
    };

    fetchAllCategories();
  }, []);

  if (loading || !featuredMarket) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          color: 'white' 
        }}>
          <h2>Loading Polyflix...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <Banner
        market={featuredMarket}
        onMoreInfo={() => setSelectedMarket(featuredMarket)}
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
      <MarketModal
        market={selectedMarket}
        onClose={() => setSelectedMarket(null)}
        onSelectMarket={setSelectedMarket}
      />
    </div>
  );
}

export default App;
