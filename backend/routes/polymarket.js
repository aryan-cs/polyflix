const express = require('express');
const router = express.Router();

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "application/json",
};

// Tag IDs - you may need to find the correct ones for each category
const TAG_IDS = {
  sports: 233,      // Adjust based on actual API
  crypto: 235,
  politics: 236,
  popculture: 237,
  finance: 238,
};

router.get('/sports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const marketsParams = new URLSearchParams({
      tag_id: String(TAG_IDS.sports),
      related_tags: "true",
      closed: "false",
      limit: String(limit * 3),
    });

    const marketsUrl = `${GAMMA_API_BASE}/markets?${marketsParams.toString()}`;
    console.log("🔍 Fetching sports markets from:", marketsUrl);

    const marketsResponse = await fetch(marketsUrl, { headers: DEFAULT_HEADERS });
    if (!marketsResponse.ok) {
      console.error(`❌ Markets API returned ${marketsResponse.status}`);
      return res.status(marketsResponse.status).json({ error: "Failed to fetch markets" });
    }

    const allMarkets = await marketsResponse.json();
    console.log(`✅ Got ${allMarkets.length} sports markets`);
    res.json(allMarkets.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const marketsParams = new URLSearchParams({
      active: "true",
      limit: String(limit * 3),
    });

    const marketsUrl = `${GAMMA_API_BASE}/markets?${marketsParams.toString()}`;
    console.log("🔍 Fetching trending markets from:", marketsUrl);

    const marketsResponse = await fetch(marketsUrl, { headers: DEFAULT_HEADERS });
    if (!marketsResponse.ok) {
      console.error(`❌ Markets API returned ${marketsResponse.status}`);
      return res.status(marketsResponse.status).json({ error: "Failed to fetch markets" });
    }

    const allMarkets = await marketsResponse.json();
    const sortedByVolume = allMarkets.sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0));
    
    console.log(`📊 Got ${allMarkets.length} markets, returning top ${limit} by volume`);
    res.json(sortedByVolume.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/politics', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const eventsParams = new URLSearchParams({
      tag_id: "2",
      related_tags: "true",
      closed: "false",
      limit: String(limit * 3),
    });

    const eventsUrl = `${GAMMA_API_BASE}/events?${eventsParams.toString()}`;
    console.log("🔍 Fetching politics events from:", eventsUrl);

    const eventsResponse = await fetch(eventsUrl, { headers: DEFAULT_HEADERS });
    if (!eventsResponse.ok) {
      console.error(`❌ Events API returned ${eventsResponse.status}`);
      return res.status(eventsResponse.status).json({ error: "Failed to fetch events" });
    }

    const allEvents = await eventsResponse.json();
    console.log(`✅ Got ${allEvents.length} politics events`);
    
    // Get markets for each event and flatten
    const allMarkets = [];
    for (const event of allEvents) {
      if (event.markets) {
        allMarkets.push(...event.markets);
      }
    }
    
    console.log(`🏛️ Got ${allMarkets.length} total politics markets from events`);
    res.json(allMarkets.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/crypto', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const marketsParams = new URLSearchParams({
      tag_id: String(TAG_IDS.crypto),
      related_tags: "true",
      closed: "false",
      limit: String(limit * 3),
    });

    const marketsUrl = `${GAMMA_API_BASE}/markets?${marketsParams.toString()}`;
    console.log("🔍 Fetching crypto markets from:", marketsUrl);

    const marketsResponse = await fetch(marketsUrl, { headers: DEFAULT_HEADERS });
    if (!marketsResponse.ok) {
      console.error(`❌ Markets API returned ${marketsResponse.status}`);
      return res.status(marketsResponse.status).json({ error: "Failed to fetch markets" });
    }

    const allMarkets = await marketsResponse.json();
    console.log(`✅ Got ${allMarkets.length} crypto markets`);
    res.json(allMarkets.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/popculture', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const marketsParams = new URLSearchParams({
      tag_id: "100",
      related_tags: "true",
      closed: "false",
      limit: String(limit * 3),
    });

    const marketsUrl = `${GAMMA_API_BASE}/markets?${marketsParams.toString()}`;
    console.log("🔍 Fetching pop culture markets from:", marketsUrl);

    const marketsResponse = await fetch(marketsUrl, { headers: DEFAULT_HEADERS });
    if (!marketsResponse.ok) {
      console.error(`❌ Markets API returned ${marketsResponse.status}`);
      return res.status(marketsResponse.status).json({ error: "Failed to fetch markets" });
    }

    const allMarkets = await marketsResponse.json();
    const sortedByVolume = allMarkets.sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0));
    
    console.log(`🎬 Got ${allMarkets.length} pop culture markets, returning top ${limit} by volume`);
    res.json(sortedByVolume.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/finance', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const marketsParams = new URLSearchParams({
      tag_id: "600",
      related_tags: "true",
      closed: "false",
      limit: String(limit * 3),
    });

    const marketsUrl = `${GAMMA_API_BASE}/markets?${marketsParams.toString()}`;
    console.log("🔍 Fetching finance/business markets from:", marketsUrl);

    const marketsResponse = await fetch(marketsUrl, { headers: DEFAULT_HEADERS });
    if (!marketsResponse.ok) {
      console.error(`❌ Markets API returned ${marketsResponse.status}`);
      return res.status(marketsResponse.status).json({ error: "Failed to fetch markets" });
    }

    const allMarkets = await marketsResponse.json();
    console.log(`✅ Got ${allMarkets.length} finance/business markets`);
    res.json(allMarkets.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;