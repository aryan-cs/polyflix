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
  
  // Deduplicate by ID
  const uniqueMarketsMap = new Map();
  allMarkets.forEach(market => {
    if (market.id && !uniqueMarketsMap.has(market.id)) {
      uniqueMarketsMap.set(market.id, market);
    }
  });
  
  const uniqueMarkets = Array.from(uniqueMarketsMap.values()).sort(
    (a, b) => (b.volumeNum || 0) - (a.volumeNum || 0)
  );

  if (strategy !== 'balanced') {
    const finalMarkets = uniqueMarkets.slice(0, limit);
    console.log(
      `✅ [RESULT] ${finalMarkets.length}/${limit} unique markets (total deduped: ${uniqueMarketsMap.size})`
    );
    return finalMarkets;
  }

  // Balanced strategy: round-robin per tag to diversify topics.
  const perTagMarkets = results.map((markets) =>
    (markets || [])
      .filter((market) => market && market.id)
      .sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
  );
  const perTagIndices = new Array(perTagMarkets.length).fill(0);
  const seen = new Set();
  const balancedMarkets = [];

  while (balancedMarkets.length < limit) {
    let added = false;
    for (let i = 0; i < perTagMarkets.length; i += 1) {
      const list = perTagMarkets[i];
      let idx = perTagIndices[i];
      while (idx < list.length && seen.has(list[idx].id)) {
        idx += 1;
      }
      perTagIndices[i] = idx;
      if (idx < list.length) {
        const market = list[idx];
        perTagIndices[i] += 1;
        if (!seen.has(market.id)) {
          seen.add(market.id);
          balancedMarkets.push(market);
          added = true;
          if (balancedMarkets.length >= limit) break;
        }
      }
    }
    if (!added) break;
  }

  if (balancedMarkets.length < limit) {
    for (const market of uniqueMarkets) {
      if (balancedMarkets.length >= limit) break;
      if (!seen.has(market.id)) {
        seen.add(market.id);
        balancedMarkets.push(market);
      }
    }
  }
    
  console.log(
    `✅ [RESULT] ${balancedMarkets.length}/${limit} unique markets (total deduped: ${uniqueMarketsMap.size})`
  );

  return balancedMarkets;
}

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
