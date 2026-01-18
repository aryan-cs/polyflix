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

        const enrich = async (markets) => {
          const enriched = await Promise.all((markets || []).map(async (m) => {
            // Map backend fields to frontend expectations
            const title = m.title || m.question || "Untitled Market";
            const existingImage = m.image || m.icon;
            
            let dynamicImage = existingImage;
            
            // Get dynamic image if no existing image or for better variety
            if (!existingImage) {
              try {
                const imageResponse = await fetch(`http://localhost:5002/api/images/search?market=${encodeURIComponent(JSON.stringify({ ...m, title }))}`);
                if (imageResponse.ok) {
                  const imageData = await imageResponse.json();
                  dynamicImage = imageData.imageUrl;
                }
              } catch (error) {
                console.warn('Image search failed for market:', title);
                // Keep existing image or use default
              }
            }
            
            return { 
              ...m, 
              title,
              image: dynamicImage
            };
          }));
          
          return enriched;
        };

        const sportsEnriched = await enrich(sports.markets);
        const trendingEnriched = await enrich(trending.markets);
        const politicsEnriched = await enrich(politics.markets);
        const cryptoEnriched = await enrich(crypto.markets);
        const popCultureEnriched = await enrich(popculture.markets);
        const financeEnriched = await enrich(finance.markets);

        setSportsMarkets(sportsEnriched);
        setTrendingMarkets(trendingEnriched);
        setPoliticsMarkets(politicsEnriched);
        setCryptoMarkets(cryptoEnriched);
        setPopCultureMarkets(popCultureEnriched);
        setFinanceMarkets(financeEnriched);
        setTechMarkets(await enrich(tech.markets));
        setClimateMarkets(await enrich(climate.markets));
        setEarningsMarkets(await enrich(earnings.markets));

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
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default App;
