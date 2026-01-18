import React, { useEffect, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import './ForYou.css';

// Hardcoded interests for the For You page
const HARDCODED_INTERESTS = [
  "Super Bowl",
  "NHL",
  "Jerome Powell",
  "Iran",
  "Tariffs"
];

function ForYou() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [interests, setInterests] = useState([]);
  const [marketsByInterest, setMarketsByInterest] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadForYouData = async () => {
      // Use hardcoded interests instead of dynamic generation
      const interestsToUse = HARDCODED_INTERESTS;

      console.log('📊 Interests to fetch:', interestsToUse);
      setInterests(interestsToUse);

      // Fetch markets for each interest - each makes a separate API call
      const allFetchedMarkets = await Promise.all(
        interestsToUse.map(async (interest) => {
          console.log(`🔍 Fetching markets for interest: "${interest}"`);
          const markets = await fetchMarketsForInterest(interest);
          console.log(`📦 Got ${markets.length} markets for "${interest}"`);
          return { interest, markets };
        })
      );

      console.log('📊 All fetched markets:', allFetchedMarkets);

      // Show all rows with their markets - allow some overlap between rows
      // Only deduplicate within each row to avoid showing the same market twice in the same row
      const marketsMap = {};
      
      for (const { interest, markets } of allFetchedMarkets) {
        if (!markets || markets.length === 0) {
          console.log(`⚠️ No markets found for interest: "${interest}"`);
          // Still add the row even if empty, or skip it - let's skip empty rows
          continue;
        }

        // Deduplicate only within this row (not across rows)
        const seenInRow = new Set();
        const uniqueMarkets = markets.filter(market => {
          // Create a unique identifier - prefer id, then slug, then normalized title
          let marketId = market.id || market.slug;
          
          // If no id or slug, use normalized title as fallback
          if (!marketId && market.title) {
            marketId = market.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
          }
          
          if (!marketId) {
            console.warn('⚠️ Market missing identifier:', market);
            return false; // Skip markets without any identifier
          }
          
          // Only check if we've seen this market in THIS row, not across all rows
          if (seenInRow.has(marketId)) {
            return false; // Already shown in this row
          }
          seenInRow.add(marketId);
          return true;
        });
        
        console.log(`✅ Markets for "${interest}": ${uniqueMarkets.length} out of ${markets.length}`);
        
        // Add the row with its markets (even if there's overlap with other rows)
        // Show row even if it has just a few markets
        if (uniqueMarkets.length > 0) {
          marketsMap[interest] = uniqueMarkets.slice(0, 15); // Limit to 15 per row for display
          console.log(`✅ Added row for "${interest}" with ${uniqueMarkets.length} markets`);
        } else {
          console.warn(`⚠️ Skipping row for "${interest}" - no valid markets`);
        }
      }

      console.log('📊 Final marketsMap:', marketsMap);
      console.log('📊 Number of rows:', Object.keys(marketsMap).length);

      setMarketsByInterest(marketsMap);
      setIsLoading(false);
    };

    loadForYouData();
  }, []);

  const fetchMarketsForInterest = async (interest) => {
    try {
      // Call backend proxy which calls Gamma API - ensures CORS works and each interest gets separate call
      // Request more markets per interest to ensure we have enough for each row
      const response = await fetch(
        `http://localhost:5002/api/polymarket/search?q=${encodeURIComponent(interest)}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        const markets = data.markets || [];
        
        console.log(`✅ Found ${markets.length} markets for interest: "${interest}"`);
        return markets;
      } else {
        const errorText = await response.text();
        console.error(`Backend error for "${interest}":`, response.status, errorText);
      }
    } catch (error) {
      console.error(`Error fetching markets for "${interest}":`, error);
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="foryou">
        <div className="foryou__header">
          <h2>For You</h2>
          <p className="foryou__subtitle">Personalized markets based on your interests</p>
        </div>
        <div className="foryou__loading">
          <div className="foryou__spinner"></div>
          <p>Analyzing your interests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="foryou">
      <div className="foryou__header">
        <h2>For You</h2>
        <p className="foryou__subtitle">Personalized markets based on your interests</p>
      </div>
      <div className="foryou__rows">
        {interests.map((interest) => {
          const markets = marketsByInterest[interest];
          // Show row if it has markets (even if empty, we could show a message, but for now only show if has markets)
          if (markets && markets.length > 0) {
            return (
              <MarketRow
                key={interest}
                title={interest}
                markets={markets}
                onSelectMarket={setSelectedMarket}
              />
            );
          }
          return null;
        })}
      </div>
      <MarketModal
        market={selectedMarket}
        onClose={() => setSelectedMarket(null)}
        onSelectMarket={setSelectedMarket}
      />
    </div>
  );
}

export default ForYou;
