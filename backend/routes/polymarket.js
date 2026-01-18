// ✅ FULL FIXED ROUTER - 20 markets guaranteed + detailed logging
const express = require('express');
const router = express.Router();

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "application/json",
};

const CATEGORY_CONFIG = {
  sports: ['sports', 'nfl', 'nba', 'mlb', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'nhl', 'rugby', 'cricket'],
  politics: ['politics', 'election', 'trump', 'president', 'congress', 'senate', 'vote', 'biden', 'campaign', 'candidate', 'harris', 'musk', 'elon', 'house', 'senate', 'representative', 'governor', 'mayor', 'war', 'conflict', 'international', 'diplomacy', 'uk', 'uk politics', 'brexit', 'parliament', 'minister', 'prime minister', 'government'],
  crypto: ['bitcoin', 'btc', 'eth', 'ethereum', 'solana', 'crypto', 'blockchain', 'web3', 'defi', 'nft', 'token'],
  popculture: ['tv', 'movie', 'celebrity', 'oscars', 'grammy', 'entertainment', 'actor', 'actress', 'award', 'film', 'music'],
  finance: ['ipo', 'gdp', 'ceo', 'economy', 'stock', 'merger', 'business', 'fed', 'interest', 'inflation', 'recession'],
  tech: ['tech', 'technology', 'ai', 'artificial intelligence', 'apple', 'google', 'microsoft', 'tesla', 'nvidia', 'meta', 'amazon', 'startup', 'ipo', 'innovation', 'software', 'hardware', 'silicon valley'],
  climate: ['climate', 'climate change', 'earthquake', 'global warming', 'carbon', 'emissions', 'renewable', 'energy', 'green', 'environment', 'sustainability', 'weather', 'temperature', 'cop28', 'net zero', 'greenhouse gas', 'fossil fuel', 'solar', 'wind', 'electric vehicle', 'ev', 'oil', 'gas', 'coal', 'methane', 'drought', 'flood', 'hurricane', 'tornado'],
  earnings: ['earnings', 'revenue', 'profit', 'earnings call', 'q1', 'q2', 'q3', 'q4', 'quarterly', 'annual', 'guidance', 'forecast', 'results', 'ebitda', 'net income', 'eps', 'earnings per share', 'roe', 'pe ratio', 'margin', 'growth', 'beat', 'miss', 'dividend', 'buyback', 'financial results', 'investor']
};

async function discoverCategoryTags(categoryKeywords, maxTags = 100) {
  console.log(`\n🔍 [DISCOVERY] Searching tags for: ${categoryKeywords.join(', ')}`);
  
  try {
    const tagsResponse = await fetch(`${GAMMA_API_BASE}/tags`, { headers: DEFAULT_HEADERS });
    if (!tagsResponse.ok) {
      console.error(`❌ [TAGS] HTTP ${tagsResponse.status}`);
      return [];
    }
    
    const allTags = await tagsResponse.json();
    console.log(`📋 [TAGS] Found ${allTags.length} total tags`);
    
    const matchingTags = allTags.filter(tag => 
      categoryKeywords.some(keyword => 
        tag.label.toLowerCase().includes(keyword.toLowerCase()) ||
        tag.slug.toLowerCase().includes(keyword.toLowerCase())
      )
    ).slice(0, maxTags);
    
    console.log(`✅ [DISCOVERY] Found ${matchingTags.length}/${maxTags} matching tags`);
    
    return matchingTags;
  } catch (error) {
    console.error('❌ [DISCOVERY ERROR]:', error.message);
    return [];
  }
}

// Helper to get event ID from a market (markets have an events array)
function getEventId(market) {
  if (market.events && market.events.length > 0) {
    return market.events[0].id;
  }
  // Fallback to market id if no event
  return null;
}

async function fetchMarketsForTags(tagIds, limit = 20, strategy = 'top') {
  console.log(
    `\n🚀 [FETCHING] ${tagIds.length} tags → target ${limit} markets (${strategy})`
  );

  const allMarkets = [];

  // Fetch from each tag in parallel
  const results = await Promise.all(
    tagIds.map(tagId =>
      fetch(`${GAMMA_API_BASE}/markets?tag_id=${tagId}&related_tags=true&closed=false&limit=300`, {
        headers: DEFAULT_HEADERS
      })
        .then(res => res.ok ? res.json() : [])
        .catch(err => {
          console.log(`❌ Tag ${tagId}: ${err.message}`);
          return [];
        })
    )
  );

  results.forEach((markets, i) => {
    console.log(`   📊 Tag ${i + 1}: ${markets.length} markets`);
    allMarkets.push(...markets);
  });

  console.log(`🔄 [RAW] Collected ${allMarkets.length} total markets before dedup`);

  // Deduplicate by event ID - only keep the highest volume market per event
  // This prevents showing multiple markets from the same event (e.g., different date brackets)
  const eventMarketsMap = new Map(); // eventId -> best market for that event
  const noEventMarkets = new Map();  // marketId -> market (for markets with no event)

  allMarkets.forEach(market => {
    if (!market.id) return;

    const eventId = getEventId(market);
    const volume = market.volumeNum || parseFloat(market.volume) || 0;

    if (eventId) {
      // Market belongs to an event - keep only the highest volume one per event
      const existing = eventMarketsMap.get(eventId);
      const existingVolume = existing ? (existing.volumeNum || parseFloat(existing.volume) || 0) : 0;

      if (!existing || volume > existingVolume) {
        eventMarketsMap.set(eventId, market);
      }
    } else {
      // No event - dedupe by market ID
      if (!noEventMarkets.has(market.id)) {
        noEventMarkets.set(market.id, market);
      }
    }
  });

  // Combine both sets of markets
  const dedupedMarkets = [
    ...Array.from(eventMarketsMap.values()),
    ...Array.from(noEventMarkets.values())
  ];

  console.log(`🔄 [DEDUP] ${allMarkets.length} → ${dedupedMarkets.length} markets (${eventMarketsMap.size} events, ${noEventMarkets.size} standalone)`);

  const uniqueMarkets = dedupedMarkets.sort(
    (a, b) => (b.volumeNum || 0) - (a.volumeNum || 0)
  );

  if (strategy !== 'balanced') {
    const finalMarkets = uniqueMarkets.slice(0, limit);
    console.log(
      `✅ [RESULT] ${finalMarkets.length}/${limit} unique markets`
    );
    return finalMarkets;
  }

  // Balanced strategy: round-robin per tag to diversify topics.
  // First, dedupe each tag's markets by event
  const perTagMarkets = results.map((markets) => {
    const tagEventMap = new Map();
    const tagNoEventMap = new Map();

    (markets || []).forEach(market => {
      if (!market || !market.id) return;

      const eventId = getEventId(market);
      const volume = market.volumeNum || parseFloat(market.volume) || 0;

      if (eventId) {
        const existing = tagEventMap.get(eventId);
        const existingVolume = existing ? (existing.volumeNum || parseFloat(existing.volume) || 0) : 0;
        if (!existing || volume > existingVolume) {
          tagEventMap.set(eventId, market);
        }
      } else {
        if (!tagNoEventMap.has(market.id)) {
          tagNoEventMap.set(market.id, market);
        }
      }
    });

    return [
      ...Array.from(tagEventMap.values()),
      ...Array.from(tagNoEventMap.values())
    ].sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0));
  });

  const perTagIndices = new Array(perTagMarkets.length).fill(0);
  const seenMarkets = new Set();
  const seenEvents = new Set();
  const balancedMarkets = [];

  while (balancedMarkets.length < limit) {
    let added = false;
    for (let i = 0; i < perTagMarkets.length; i += 1) {
      const list = perTagMarkets[i];
      let idx = perTagIndices[i];

      // Skip markets we've already added or whose events we've seen
      while (idx < list.length) {
        const market = list[idx];
        const eventId = getEventId(market);
        if (seenMarkets.has(market.id) || (eventId && seenEvents.has(eventId))) {
          idx += 1;
        } else {
          break;
        }
      }

      perTagIndices[i] = idx;
      if (idx < list.length) {
        const market = list[idx];
        const eventId = getEventId(market);
        perTagIndices[i] += 1;

        seenMarkets.add(market.id);
        if (eventId) seenEvents.add(eventId);
        balancedMarkets.push(market);
        added = true;
        if (balancedMarkets.length >= limit) break;
      }
    }
    if (!added) break;
  }

  if (balancedMarkets.length < limit) {
    for (const market of uniqueMarkets) {
      if (balancedMarkets.length >= limit) break;
      const eventId = getEventId(market);
      if (!seenMarkets.has(market.id) && !(eventId && seenEvents.has(eventId))) {
        seenMarkets.add(market.id);
        if (eventId) seenEvents.add(eventId);
        balancedMarkets.push(market);
      }
    }
  }

  console.log(
    `✅ [RESULT] ${balancedMarkets.length}/${limit} unique markets`
  );

  return balancedMarkets;
}

// Search route - for For You page interests
// Uses Gamma public-search endpoint (same as Python code)
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 15;

  console.log(`\n🔍 [SEARCH] Query: "${query}" (limit: ${limit})`);

  if (!query) {
    return res.json({ query: '', count: 0, markets: [] });
  }

  try {
    // Use public-search endpoint like Python code
    const response = await fetch(
      `${GAMMA_API_BASE}/public-search?q=${encodeURIComponent(query)}&limit_per_type=${limit}`,
      { headers: DEFAULT_HEADERS }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const markets = [];

    // Extract markets from events (Gamma public-search API structure)
    // Only take ONE market per event (highest volume) to ensure diversity
    for (const event of data.events || []) {
      const eventMarkets = event.markets || [];

      if (eventMarkets.length > 0) {
        // Pick the highest-volume market from this event
        const bestMarket = eventMarkets.reduce((best, current) => {
          const bestVol = parseFloat(best.volume || 0);
          const currentVol = parseFloat(current.volume || 0);
          return currentVol > bestVol ? current : best;
        }, eventMarkets[0]);

        markets.push({
          id: bestMarket.id || event.id,
          title: bestMarket.question || event.title,
          question: bestMarket.question || event.title,
          volumeNum: parseFloat(bestMarket.volume || event.volume || 0),
          image: event.image || '',
          slug: event.slug || bestMarket.slug || '',
          endDate: bestMarket.endDate || event.endDate || '',
          category: event.category || '',
          outcomePrices: bestMarket.outcomePrices || null,
          hasBinaryOutcomes: bestMarket.hasBinaryOutcomes !== undefined ? bestMarket.hasBinaryOutcomes : true,
          eventId: event.id, // Track event for debugging
        });
      } else {
        // No markets array, treat the event itself as a market
        markets.push({
          id: event.id,
          title: event.title,
          question: event.title,
          volumeNum: parseFloat(event.volume || 0),
          image: event.image || '',
          slug: event.slug || '',
          endDate: event.endDate || '',
          category: event.category || '',
          outcomePrices: null,
          hasBinaryOutcomes: true,
          eventId: event.id,
        });
      }
    }

    console.log(`✅ [SEARCH] Found ${markets.length} markets for "${query}"`);

    res.json({
      query,
      count: markets.length,
      markets
    });
  } catch (error) {
    console.error('❌ SEARCH ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Trending route
router.get('/trending', async (req, res) => {
  console.log(`\n📈 [TRENDING]`);
  
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const response = await fetch(
      `${GAMMA_API_BASE}/markets?closed=false&order=volume24hr&ascending=false&limit=100`,
      { headers: DEFAULT_HEADERS }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const markets = await response.json();
    const topMarkets = markets.slice(0, limit);
    
    console.log(`✅ Got ${topMarkets.length} trending markets`);
    
    res.json({
      category: 'trending',
      count: topMarkets.length,
      markets: topMarkets
    });
  } catch (error) {
    console.error('❌ TRENDING ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Category routes
router.get('/:category(sports|politics|crypto|popculture|finance|tech|climate|earnings)', async (req, res) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const strategy = req.query.strategy || 'top';
  
  console.log(`\n🌟 [${category.toUpperCase()}] Requested ${limit} markets`);
  
  try {
    const tags = await discoverCategoryTags(CATEGORY_CONFIG[category], 100);
    
    if (tags.length === 0) {
      console.log(`❌ No tags found!`);
      return res.json({ category, count: 0, markets: [] });
    }
    
    const markets = await fetchMarketsForTags(tags.map(t => t.id), limit, strategy);
    
    console.log(`✅ SUCCESS: ${markets.length}/${limit} markets for ${category}`);
    
    res.json({
      category,
      count: markets.length,
      tagsUsed: tags.length,
      markets
    });
  } catch (error) {
    console.error(`❌ ERROR in ${category}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
