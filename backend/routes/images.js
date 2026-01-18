const express = require('express');
const router = express.Router();

// Google Custom Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
  console.warn('⚠️  Google API credentials not found. Image search will use fallback images.');
}

// Fallback images by category
const fallbackImages = {
  politics: [
    'https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586769852044-692d6df3490f?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&auto=format&fit=crop'
  ],
  crypto: [
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&auto=format&fit=crop'
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop'
  ],
  business: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586264515491-14a6f13ad2aa?w=400&auto=format&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop'
  ]
};

// Extract keywords from market title and description
function extractKeywords(market) {
  const title = market.title || market.question || '';
  const description = market.description || '';
  const category = market.category || '';
  const marketId = market.id || market._id || '';
  
  // Combine and clean text
  const fullText = `${title} ${description} ${category}`.toLowerCase();
  
  // Remove common prediction market terms that aren't visual
  const stopWords = ['will', 'market', 'prediction', 'resolve', 'yes', 'no', 'price', 'reach', 'by', 'end', 'before', 'after'];
  
  // Extract meaningful keywords (2+ characters, not stop words)
  const words = fullText.match(/\b\w{2,}\b/g) || [];
  const keywords = words.filter(word => !stopWords.includes(word)).slice(0, 3);
  
  // Add variation for same-topic markets using market ID
  let searchTerms = keywords.join(' ');
  if (marketId) {
    // Add variety terms based on market ID hash
    const idHash = marketId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const varietyTerms = ['chart', 'graph', 'analysis', 'trend', 'data', 'forecast', 'market', 'trading'];
    const varietyTerm = varietyTerms[idHash % varietyTerms.length];
    searchTerms += ` ${varietyTerm}`;
  }
  
  return searchTerms;
}

// Get category for fallback
function getMarketCategory(market) {
  const title = (market.title || market.question || '').toLowerCase();
  const description = (market.description || '').toLowerCase();
  const category = (market.category || '').toLowerCase();
  
  const text = `${title} ${description} ${category}`;
  
  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('ethereum') || text.includes('coin')) {
    return 'crypto';
  }
  if (text.includes('trump') || text.includes('election') || text.includes('president') || text.includes('politics')) {
    return 'politics';
  }
  if (text.includes('sports') || text.includes('nba') || text.includes('nfl') || text.includes('football') || text.includes('basketball')) {
    return 'sports';
  }
  if (text.includes('stock') || text.includes('company') || text.includes('business') || text.includes('earnings')) {
    return 'business';
  }
  
  return 'default';
}

router.get('/search', async (req, res) => {
  const { market } = req.query;
  
  if (!market) {
    return res.status(400).json({ error: 'Missing market data' });
  }
  
  try {
    const marketData = typeof market === 'string' ? JSON.parse(market) : market;
    const keywords = extractKeywords(marketData);
    
    console.log(`🖼️  Searching images for: ${keywords}`);
    
    // Try Google Custom Search if configured
    if (GOOGLE_API_KEY && SEARCH_ENGINE_ID) {
      try {
        const searchQuery = `${keywords} news photo`;
        const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=10&safe=active&imgSize=large`;
        
        const response = await fetch(googleUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          // Get a random image from the results
          const randomImage = data.items[Math.floor(Math.random() * data.items.length)];
          console.log(`✅ Found image: ${randomImage.link}`);
          
          return res.json({
            imageUrl: randomImage.link,
            source: 'google',
            keywords: keywords,
            alt: randomImage.title || keywords
          });
        }
      } catch (error) {
        console.error('❌ Google API error:', error);
      }
    }
    
    // Fallback to category-based images
    const category = getMarketCategory(marketData);
    const categoryImages = fallbackImages[category] || fallbackImages.default;
    const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
    
    console.log(`📸 Using fallback image (${category}): ${randomImage}`);
    
    res.json({
      imageUrl: randomImage,
      source: 'fallback',
      category: category,
      keywords: keywords
    });
    
  } catch (error) {
    console.error('❌ Image search error:', error);
    
    // Emergency fallback
    const emergencyImage = fallbackImages.default[0];
    res.json({
      imageUrl: emergencyImage,
      source: 'emergency',
      error: error.message
    });
  }
});

module.exports = router;