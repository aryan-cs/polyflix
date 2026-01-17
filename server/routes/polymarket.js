const express = require('express');
const router = express.Router();

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "application/json",
};


router.get('/sports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Step 1: Get sports leagues
    const sportsUrl = `${GAMMA_API_BASE}/sports`;
    console.log("🔍 Fetching sports leagues from:", sportsUrl);

    const sportsResponse = await fetch(sportsUrl, { headers: DEFAULT_HEADERS });
    if (!sportsResponse.ok) {
      console.error(`❌ Sports API returned ${sportsResponse.status}`);
      return res.status(sportsResponse.status).json({ error: "Failed to fetch sports" });
    }

    const leagues = await sportsResponse.json();
    console.log(`✅ Got ${leagues.length} sports leagues`);

    // Step 2: Get ALL active sports events (no series_id filter)
    const eventsParams = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: String(limit * 2), // fetch 2x to get more variety
    });

    const eventsUrl = `${GAMMA_API_BASE}/events?${eventsParams.toString()}`;
    console.log("🔍 Fetching all sports events from:", eventsUrl);

    const eventsResponse = await fetch(eventsUrl, { headers: DEFAULT_HEADERS });
    if (!eventsResponse.ok) {
      console.error(`❌ Events API returned ${eventsResponse.status}`);
      return res.status(eventsResponse.status).json({ error: "Failed to fetch events" });
    }

    const allEvents = await eventsResponse.json();
    console.log(`✅ Got ${allEvents.length} total events`);

    // Filter for sports events only
    const sportsEvents = allEvents.filter((ev) => {
      const tags = ev.tags || [];
      const tagLabels = tags.map(t => t.label?.toLowerCase() || '');
      return tagLabels.some(label => 
        label.includes('nfl') || label.includes('nba') || label.includes('soccer') ||
        label.includes('football') || label.includes('basketball') || label.includes('baseball') ||
        label.includes('sports') || label.includes('olympics') || label.includes('cricket')
      );
    });

    console.log(`🏈 Filtered to ${sportsEvents.length} sports events`);
    res.json(sportsEvents.slice(0, limit));
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
    console.log(`✅ Got ${allMarkets.length} total markets`);

    // Sort by volume in JavaScript
    const sortedByVolume = allMarkets.sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0));
    
    console.log(`📊 Returning top ${limit} by volume`);
    res.json(sortedByVolume.slice(0, limit));
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;