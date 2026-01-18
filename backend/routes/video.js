const express = require('express');
const router = express.Router();

// Check for required API key
if (!process.env.PERPLEXITY_API_KEY) {
  console.warn('⚠️  PERPLEXITY_API_KEY not found in environment variables');
}

router.get('/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    console.log(`🎥 Searching video for: ${query}`);

    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({ 
        error: "API key not configured", 
        message: "Please set PERPLEXITY_API_KEY in your .env file" 
      });
    }

    const systemPrompt = `You are a video search assistant. Find a specific YouTube video URL relevant to the user's query. 
    1. For sports queries (e.g. 'Bulls win'), find recent gameplay highlights or official recaps.
    2. For news/politics (e.g. 'Supreme Court'), find a reputable news report clip (CNN, MSNBC, Fox, BBC, etc).
    3. Return ONLY a JSON object with the property "videoId" (the 11-character YouTube ID). 
    Example: { "videoId": "dQw4w9WgXcQ" }. Do not wrap in markdown.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online', // Using an online-capable model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Find a video for: ${query}` }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error(`❌ Perplexity API Error Status: ${response.status}`);
      const errText = await response.text();
      console.error(`❌ Perplexity API Error Body: ${errText}`);
      throw new Error(`Perplexity API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    console.log("📝 Raw Perplexity Content:", content);
    
    // Attempt to parse JSON from the response
    let videoId = null;
    try {
      // Clean potential markdown code blocks
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      videoId = parsed.videoId;
    } catch (e) {
      console.error("Failed to parse JSON from Perplexity:", content);
      // Fallback regex extract
      const match = content.match(/"videoId":\s*"([^"]+)"/);
      if (match) videoId = match[1];
    }

    if (!videoId) {
      return res.status(404).json({ error: "No video found" });
    }

    console.log(`✅ Found Video ID: ${videoId}`);
    res.json({ videoId });

  } catch (error) {
    console.error("❌ Video Search Error:", error.message);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

module.exports = router;
