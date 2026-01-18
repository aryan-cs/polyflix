import React, { useEffect, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { getWatchlists } from './MyWatchlists';
import { getStoredInterests } from './ProfilePage';
import { USE_GEMINI_MODE } from '../config/features';
import './ForYou.css';

// Extract keywords from market titles (same as ProfilePage)
const extractKeywords = (markets) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
    'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
    'there', 'then', 'once', 'if', 'before', 'after', 'above', 'below',
    'between', 'under', 'over', 'again', 'further', 'any', 'win', 'yes',
    '2024', '2025', '2026', '2027', 'january', 'february', 'march', 'april',
    'may', 'june', 'july', 'august', 'september', 'october', 'november',
    'december', 'price', 'market', 'trading', 'end', 'start', 'week', 'month'
  ]);

  const keywordCounts = {};

  markets.forEach(market => {
    if (!market.title) return;

    const words = market.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    words.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });
  });

  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
};

// Generate interests from keywords (non-Gemini mode fallback)
const generateInterestsFromKeywords = (keywords) => {
  if (keywords.length === 0) return [];
  
  const topKeywords = keywords.slice(0, 8);
  const interests = [];
  const used = new Set();
  
  for (const { word } of topKeywords) {
    if (used.has(word)) continue;
    
    const related = topKeywords.filter(k => {
      if (k.word === word) return true;
      const normalized = (w) => w.toLowerCase();
      const w1 = normalized(word);
      const w2 = normalized(k.word);
      return w1.includes(w2) || w2.includes(w1) || 
             w1.substring(0, 4) === w2.substring(0, 4);
    });
    
    if (related.length > 1 && related[0].word !== word) {
      interests.push(`${related[0].word} ${word}`);
      related.forEach(r => used.add(r.word));
    } else {
      interests.push(word);
      used.add(word);
    }
    
    if (interests.length >= 5) break;
  }
  
  return deduplicateInterests(interests).slice(0, 5);
};

// Deduplicate overlapping interests
const deduplicateInterests = (interests) => {
  if (interests.length <= 1) return interests;

  const normalized = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const getWords = (str) => normalized(str).split(/\s+/).filter(w => w.length > 2);

  const filtered = [];
  for (const interest of interests) {
    const interestWords = getWords(interest);
    let isDuplicate = false;

    for (const existing of filtered) {
      const existingWords = getWords(existing);
      // Check if they share significant words (more than 50% overlap)
      const commonWords = interestWords.filter(w => existingWords.includes(w));
      const overlapRatio = commonWords.length / Math.max(interestWords.length, existingWords.length);
      
      // Also check if one is a substring of the other
      const normalizedInterest = normalized(interest);
      const normalizedExisting = normalized(existing);
      const isSubstring = normalizedInterest.includes(normalizedExisting) || 
                         normalizedExisting.includes(normalizedInterest);

      if (overlapRatio > 0.5 || isSubstring) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      filtered.push(interest);
    }
  }

  return filtered;
};

function ForYou() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [interests, setInterests] = useState([]);
  const [marketsByInterest, setMarketsByInterest] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadForYouData = async () => {
      const watchlists = getWatchlists();
      const allMarkets = watchlists.flatMap(w => w.markets);

      if (allMarkets.length === 0) {
        setIsLoading(false);
        setError('Add markets to your watchlists to get personalized recommendations.');
        return;
      }

      // Get interests from localStorage (set by ProfilePage)
      let storedInterests = getStoredInterests();
      
      // Deduplicate interests to remove overlaps
      storedInterests = deduplicateInterests(storedInterests);

      // If no stored interests and in non-Gemini mode, generate from keywords
      if (storedInterests.length === 0 && !USE_GEMINI_MODE) {
        const keywords = extractKeywords(allMarkets);
        storedInterests = generateInterestsFromKeywords(keywords);
        
        // Store for future use
        if (storedInterests.length > 0) {
          localStorage.setItem('polyflix_interests', JSON.stringify(storedInterests));
        }
      }

      if (storedInterests.length === 0) {
        setIsLoading(false);
        setError(USE_GEMINI_MODE 
          ? 'Visit your Profile page to generate personalized interests based on your watchlists.'
          : 'Add more markets to your watchlists to get personalized recommendations.');
        return;
      }

      console.log('📊 Interests to fetch:', storedInterests);
      setInterests(storedInterests);

      // Fetch markets for each interest - each makes a separate API call
      const allFetchedMarkets = await Promise.all(
        storedInterests.map(async (interest) => {
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

  if (error) {
    return (
      <div className="foryou">
        <div className="foryou__header">
          <h2>For You</h2>
          <p className="foryou__subtitle">Personalized markets based on your interests</p>
        </div>
        <div className="foryou__empty">
          <p>{error}</p>
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
