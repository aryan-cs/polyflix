/**
 * Test script to fetch price history for a specific Polymarket market
 * Market: "Khamenei out as Supreme Leader of Iran by January 31?"
 * URL: https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-january-31
 */

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const CLOB_API_BASE = "https://clob.polymarket.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "application/json",
};

// Market slug from URL
const MARKET_SLUG = "khamenei-out-as-supreme-leader-of-iran-by-january-31";

async function findMarketBySlug(slug) {
  console.log(`\n🔍 [TEST] Searching for market with slug: ${slug}`);
  
  try {
    // Search for the market using the slug
    const searchResponse = await fetch(
      `${GAMMA_API_BASE}/public-search?q=${encodeURIComponent(slug)}&limit_per_type=10`,
      { headers: DEFAULT_HEADERS }
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: HTTP ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`✅ [TEST] Search returned ${searchData.events?.length || 0} events`);
    
    // Find the market that matches our slug
    for (const event of searchData.events || []) {
      if (event.slug === slug || event.slug?.includes(slug)) {
        console.log(`✅ [TEST] Found matching event: ${event.id}`);
        console.log(`   Title: ${event.title}`);
        console.log(`   Slug: ${event.slug}`);
        
        // Get the first market from this event
        if (event.markets && event.markets.length > 0) {
          const market = event.markets[0];
          console.log(`   Market ID: ${market.id}`);
          return market.id;
        } else if (event.id) {
          // Sometimes the event itself is the market
          return event.id;
        }
      }
    }
    
    // If not found by slug, try to find by title keywords
    const keywords = slug.split('-');
    for (const event of searchData.events || []) {
      const titleLower = (event.title || '').toLowerCase();
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        console.log(`✅ [TEST] Found potential match by title: ${event.id}`);
        console.log(`   Title: ${event.title}`);
        
        if (event.markets && event.markets.length > 0) {
          return event.markets[0].id;
        } else if (event.id) {
          return event.id;
        }
      }
    }
    
    throw new Error(`Market not found with slug: ${slug}`);
  } catch (error) {
    console.error(`❌ [TEST] Error finding market:`, error.message);
    throw error;
  }
}

async function getMarketDetails(marketId) {
  console.log(`\n📊 [TEST] Fetching market details for: ${marketId}`);
  
  try {
    const response = await fetch(
      `${GAMMA_API_BASE}/markets/${marketId}`,
      { headers: DEFAULT_HEADERS }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const market = await response.json();
    console.log(`✅ [TEST] Got market details`);
    console.log(`   Question: ${market.question || market.title}`);
    console.log(`   Market ID: ${market.id}`);
    
    return market;
  } catch (error) {
    console.error(`❌ [TEST] Error fetching market details:`, error.message);
    throw error;
  }
}

function extractYesTokenId(marketDetails) {
  console.log(`\n🔑 [TEST] Extracting "Yes" token ID...`);
  
  // Parse outcomes - handle both array and JSON string formats
  let outcomes = marketDetails.outcomes;
  if (typeof outcomes === 'string') {
    try {
      outcomes = JSON.parse(outcomes);
    } catch (e) {
      console.error(`❌ [TEST] Failed to parse outcomes string:`, e);
      outcomes = [];
    }
  }
  if (!Array.isArray(outcomes)) {
    console.error(`❌ [TEST] Outcomes is not an array:`, outcomes);
    outcomes = [];
  }
  
  // Parse clobTokenIds - handle both array and JSON string formats
  let clobTokenIds = marketDetails.clobTokenIds;
  if (typeof clobTokenIds === 'string') {
    try {
      clobTokenIds = JSON.parse(clobTokenIds);
    } catch (e) {
      console.error(`❌ [TEST] Failed to parse clobTokenIds string:`, e);
      clobTokenIds = [];
    }
  }
  if (!Array.isArray(clobTokenIds)) {
    console.error(`❌ [TEST] clobTokenIds is not an array:`, clobTokenIds);
    clobTokenIds = [];
  }
  
  console.log(`   Outcomes:`, outcomes);
  console.log(`   clobTokenIds:`, clobTokenIds);
  
  // Find "Yes" token ID
  const yesIndex = outcomes.findIndex(
    outcome => outcome && typeof outcome === 'string' && outcome.toLowerCase() === 'yes'
  );
  
  if (yesIndex === -1) {
    throw new Error(`No "Yes" outcome found. Available outcomes: ${outcomes.join(', ')}`);
  }
  
  if (!clobTokenIds[yesIndex]) {
    throw new Error(`No token ID found at index ${yesIndex} for "Yes" outcome`);
  }
  
  const yesTokenId = clobTokenIds[yesIndex];
  console.log(`✅ [TEST] Found "Yes" token ID: ${yesTokenId}`);
  
  return yesTokenId;
}

async function getPriceHistory(tokenId) {
  console.log(`\n📈 [TEST] Fetching price history for token: ${tokenId}`);
  
  try {
    const url = `${CLOB_API_BASE}/prices-history?market=${tokenId}&interval=max`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [TEST] Got response`);
    console.log(`   Data type:`, typeof data, Array.isArray(data) ? 'array' : 'object');
    console.log(`   Data keys:`, data ? Object.keys(data) : 'null');
    
    // Handle different response formats
    let priceHistory = [];
    if (Array.isArray(data)) {
      priceHistory = data;
    } else if (data && Array.isArray(data.history)) {
      priceHistory = data.history;
    } else if (data && Array.isArray(data.data)) {
      priceHistory = data.data;
    } else {
      console.warn(`⚠️ [TEST] Unexpected response format:`, data);
      priceHistory = [];
    }
    
    console.log(`   Total price points: ${priceHistory.length}`);
    
    // Show first and last timestamps to understand the data range
    if (priceHistory.length > 0) {
      const first = priceHistory[0];
      const last = priceHistory[priceHistory.length - 1];
      const firstDate = new Date(first.t * 1000).toISOString();
      const lastDate = new Date(last.t * 1000).toISOString();
      console.log(`   First timestamp: ${first.t} (${firstDate})`);
      console.log(`   Last timestamp: ${last.t} (${lastDate})`);
    }
    
    // Filter to last month
    // CLOB API returns timestamps in Unix seconds, not milliseconds
    const oneMonthAgoSeconds = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    console.log(`   Filtering to timestamps >= ${oneMonthAgoSeconds} (${new Date(oneMonthAgoSeconds * 1000).toISOString()})`);
    
    const filteredHistory = priceHistory.filter(item => {
      if (!item || typeof item.t === 'undefined') return false;
      const timestamp = typeof item.t === 'string' ? parseInt(item.t) : item.t;
      return timestamp >= oneMonthAgoSeconds;
    });
    
    console.log(`   Price points in last month: ${filteredHistory.length}`);
    
    // Show sample data
    if (filteredHistory.length > 0) {
      console.log(`\n   Sample price points (first 5):`);
      filteredHistory.slice(0, 5).forEach((point, idx) => {
        const date = new Date(point.t * 1000).toISOString();
        const price = typeof point.p === 'number' ? point.p : parseFloat(point.p);
        const pricePercent = (price * 100).toFixed(2);
        console.log(`   ${idx + 1}. ${date}: ${pricePercent}%`);
      });
      
      if (filteredHistory.length > 5) {
        const lastPoint = filteredHistory[filteredHistory.length - 1];
        const date = new Date(lastPoint.t * 1000).toISOString();
        const price = typeof lastPoint.p === 'number' ? lastPoint.p : parseFloat(lastPoint.p);
        const pricePercent = (price * 100).toFixed(2);
        console.log(`   ... (${filteredHistory.length - 5} more)`);
        console.log(`   Last: ${date}: ${pricePercent}%`);
      }
    }
    
    return filteredHistory;
  } catch (error) {
    console.error(`❌ [TEST] Error fetching price history:`, error.message);
    throw error;
  }
}

async function testPriceHistory() {
  console.log('🚀 [TEST] Starting price history test for Khamenei market\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Find market ID by slug
    const marketId = await findMarketBySlug(MARKET_SLUG);
    
    // Step 2: Get full market details
    const marketDetails = await getMarketDetails(marketId);
    
    // Step 3: Extract "Yes" token ID
    const yesTokenId = extractYesTokenId(marketDetails);
    
    // Step 4: Fetch price history
    const priceHistory = await getPriceHistory(yesTokenId);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ [TEST] SUCCESS!');
    console.log(`   Market ID: ${marketId}`);
    console.log(`   Yes Token ID: ${yesTokenId}`);
    console.log(`   Price history points: ${priceHistory.length}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('❌ [TEST] FAILED:', error.message);
    console.error('   Stack:', error.stack);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testPriceHistory();
