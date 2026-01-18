import React, { useState, useEffect } from 'react';
import { getWatchlists, getBlacklist } from './MyWatchlists';
import { USE_GEMINI_MODE } from '../config/features';
import './ProfilePage.css';

// Extract keywords from market titles
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

// Get category color
const getCategoryColor = (category) => {
  const colors = {
    Sports: '#e50914',
    Crypto: '#f5a623',
    Politics: '#4a90d9',
    Finance: '#50c878',
    Culture: '#9b59b6',
    Tech: '#00bcd4',
    Entertainment: '#9b59b6',
    Science: '#00bcd4',
    Business: '#50c878',
    Other: '#808080'
  };
  return colors[category] || colors.Other;
};

// NON-GEMINI MODE: Generate interests from keywords
const generateInterestsFromKeywords = (keywords) => {
  if (keywords.length === 0) return [];
  
  // Take top keywords and create interest phrases
  const topKeywords = keywords.slice(0, 8);
  const interests = [];
  
  // Group related keywords together
  const used = new Set();
  for (const { word } of topKeywords) {
    if (used.has(word)) continue;
    
    // Find related keywords (same root or similar)
    const related = topKeywords.filter(k => {
      if (k.word === word) return true;
      const normalized = (w) => w.toLowerCase();
      const w1 = normalized(word);
      const w2 = normalized(k.word);
      return w1.includes(w2) || w2.includes(w1) || 
             w1.substring(0, 4) === w2.substring(0, 4);
    });
    
    // Create interest from top related keyword or combine if multiple
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

// NON-GEMINI MODE: Generate categories from keywords and markets
const generateCategoriesFromKeywords = (markets, keywords) => {
  const categoryKeywords = {
    Sports: ['sports', 'nfl', 'nba', 'mlb', 'soccer', 'football', 'basketball', 'baseball', 'hockey', 'tennis', 'golf', 'ufc', 'boxing', 'olympics'],
    Politics: ['trump', 'biden', 'election', 'president', 'senate', 'congress', 'supreme', 'court', 'political', 'vote', 'democrat', 'republican'],
    Crypto: ['bitcoin', 'crypto', 'ethereum', 'btc', 'eth', 'blockchain', 'defi', 'nft', 'coin', 'token'],
    Finance: ['stock', 'market', 'dollar', 'inflation', 'fed', 'interest', 'rate', 'economy', 'trading', 'investment'],
    Tech: ['ai', 'artificial', 'intelligence', 'tech', 'apple', 'google', 'microsoft', 'meta', 'tesla', 'software'],
    Entertainment: ['oscar', 'grammy', 'movie', 'film', 'music', 'celebrity', 'award', 'show', 'tv', 'series'],
    Science: ['space', 'nasa', 'climate', 'weather', 'research', 'study', 'discovery'],
    Business: ['company', 'business', 'corporate', 'earnings', 'revenue', 'profit']
  };
  
  const categoryCounts = {};
  const totalMarkets = markets.length;
  
  // Count markets by category based on keywords
  markets.forEach(market => {
    const title = (market.title || '').toLowerCase();
    let categorized = false;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => title.includes(kw))) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      categoryCounts['Other'] = (categoryCounts['Other'] || 0) + 1;
    }
  });
  
  // Convert to percentage format
  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      percentage: Math.round((count / totalMarkets) * 100)
    }))
    .filter(c => c.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
};

// NON-GEMINI MODE: Generate summary from keywords
const generateSummaryFromKeywords = (keywords, markets, dislikedMarkets) => {
  if (keywords.length === 0) {
    return 'Add markets to your watchlists to see your interests here.';
  }
  
  const topInterests = keywords.slice(0, 3).map(k => k.word).join(', ');
  const marketCount = markets.length;
  const dislikeCount = dislikedMarkets.length;
  
  let summary = `You're tracking ${marketCount} market${marketCount !== 1 ? 's' : ''} with interests in ${topInterests}.`;
  
  if (dislikeCount > 0) {
    summary += ` You've filtered out ${dislikeCount} market${dislikeCount !== 1 ? 's' : ''} that don't match your preferences.`;
  }
  
  return summary;
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

// Generate a hash/fingerprint of watchlist and blacklist data
const generateDataHash = (markets, blacklist) => {
  const marketIds = markets.map(m => m.id).sort().join(',');
  const blacklistIds = blacklist.map(m => m.id).sort().join(',');
  const combined = `${marketIds}|${blacklistIds}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Get stored data hash from localStorage
const getStoredDataHash = () => {
  try {
    return localStorage.getItem('polyflix_data_hash');
  } catch {
    return null;
  }
};

// Store data hash in localStorage
const storeDataHash = (hash) => {
  try {
    localStorage.setItem('polyflix_data_hash', hash);
  } catch (e) {
    console.error('Error storing data hash:', e);
  }
};

// Get stored interests from localStorage
export const getStoredInterests = () => {
  try {
    const stored = localStorage.getItem('polyflix_interests');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Get stored AI summary from localStorage
const getStoredAiSummary = () => {
  try {
    return localStorage.getItem('polyflix_ai_summary') || '';
  } catch {
    return '';
  }
};

// Store AI summary in localStorage
const storeAiSummary = (summary) => {
  try {
    localStorage.setItem('polyflix_ai_summary', summary);
  } catch (e) {
    console.error('Error storing AI summary:', e);
  }
};

// Get stored categories from localStorage
const getStoredCategories = () => {
  try {
    const stored = localStorage.getItem('polyflix_categories');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Store categories in localStorage
const storeCategories = (categories) => {
  try {
    localStorage.setItem('polyflix_categories', JSON.stringify(categories));
  } catch (e) {
    console.error('Error storing categories:', e);
  }
};

function ProfilePage() {
  const [keywords, setKeywords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [interests, setInterests] = useState([]);
  const [stats, setStats] = useState({
    totalWatchlists: 0,
    totalMarkets: 0,
    totalDislikes: 0
  });
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [interestsLoading, setInterestsLoading] = useState(false);

  useEffect(() => {
    // Load data from localStorage
    const loadedWatchlists = getWatchlists();
    const loadedBlacklist = getBlacklist();

    // Aggregate all markets from watchlists
    const allMarkets = loadedWatchlists.flatMap(w => w.markets);

    // Extract keywords
    const extractedKeywords = extractKeywords(allMarkets);
    setKeywords(extractedKeywords);

    // Calculate stats
    setStats({
      totalWatchlists: loadedWatchlists.length,
      totalMarkets: allMarkets.length,
      totalDislikes: loadedBlacklist.length
    });

    // Check if data has changed
    const currentHash = generateDataHash(allMarkets, loadedBlacklist);
    const storedHash = getStoredDataHash();

    if (allMarkets.length > 0) {
      if (currentHash === storedHash) {
        // Data hasn't changed, load from localStorage
        const storedInterests = getStoredInterests();
        const storedSummary = getStoredAiSummary();
        const storedCategories = getStoredCategories();
        
        setInterests(storedInterests);
        setAiSummary(storedSummary);
        setCategories(storedCategories);
      } else {
        // Data has changed, regenerate content
        storeDataHash(currentHash);
        
        if (USE_GEMINI_MODE) {
          // Gemini mode: use AI
          generateAiContent(allMarkets, loadedBlacklist);
        } else {
          // Non-Gemini mode: use keywords
          generateKeywordContent(allMarkets, loadedBlacklist, extractedKeywords);
        }
      }
    } else {
      // No markets, clear stored data
      setInterests([]);
      setAiSummary('');
      setCategories([]);
      if (storedHash !== null) {
        // Clear the hash so it regenerates when markets are added back
        localStorage.removeItem('polyflix_data_hash');
        localStorage.removeItem('polyflix_interests');
        localStorage.removeItem('polyflix_ai_summary');
        localStorage.removeItem('polyflix_categories');
      }
    }
  }, []);

  // NON-GEMINI MODE: Generate content from keywords
  const generateKeywordContent = (markets, dislikedMarkets, keywords) => {
    // Generate interests
    const keywordInterests = generateInterestsFromKeywords(keywords);
    setInterests(keywordInterests);
    localStorage.setItem('polyflix_interests', JSON.stringify(keywordInterests));
    
    // Generate categories
    const keywordCategories = generateCategoriesFromKeywords(markets, keywords);
    setCategories(keywordCategories);
    storeCategories(keywordCategories);
    
    // Generate summary
    const keywordSummary = generateSummaryFromKeywords(keywords, markets, dislikedMarkets);
    setAiSummary(keywordSummary);
    storeAiSummary(keywordSummary);
  };

  // GEMINI MODE: Generate content using AI
  const generateAiContent = async (markets, dislikedMarkets) => {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('REACT_APP_GEMINI_API_KEY not set');
      return;
    }

    const marketTitles = markets.map(m => m.title).join('\n- ');
    const dislikedTitles = dislikedMarkets.map(m => m.title).join('\n- ');

    // Generate both summary and categories in parallel
    setAiLoading(true);
    setCategoriesLoading(true);

    // Generate AI Summary
    generateAiSummary(API_KEY, marketTitles, dislikedTitles);

    // Generate Category Breakdown
    generateCategoryBreakdown(API_KEY, marketTitles);

    // Generate interests for For You page
    generateInterests(API_KEY, marketTitles);
  };

  const generateInterests = async (API_KEY, marketTitles) => {
    setInterestsLoading(true);
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze these prediction market titles and identify the user's distinct interest areas for finding similar markets.

Markets in their watchlist:
- ${marketTitles}

Rules:
1. Return 2-5 interests (fewer is better if interests overlap)
2. Each interest must be COMPLETELY DIFFERENT from the others - no overlapping topics
3. Each interest should be 1-3 words, good as a search query
4. Prioritize specificity: "NBA playoffs" is better than "sports"
5. If multiple markets are about the same broad topic (e.g., Trump, Supreme Court), pick ONE representative interest, not multiple variations
6. Cover the breadth of their interests, not depth in one area

BAD example (too similar): ["Trump tariffs", "Trump travel", "Trump policies", "Supreme Court", "Supreme Court decisions"]
GOOD example (diverse): ["Trump policies", "Bitcoin price", "NBA playoffs", "Oscar winners"]

Return ONLY a JSON array of strings, nothing else. Example: ["NBA playoffs", "Bitcoin price", "US elections"]`
              }]
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          const jsonMatch = text.match(/\[.*\]/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Deduplicate to remove any overlapping interests
            const deduplicated = deduplicateInterests(parsed);
            const validInterests = deduplicated.slice(0, 5);
            setInterests(validInterests);
            localStorage.setItem('polyflix_interests', JSON.stringify(validInterests));
            console.log('Stored interests:', validInterests);
          }
        } catch (e) {
          console.error('Error parsing interests JSON:', e, text);
        }
      } else {
        const error = await response.text();
        console.error('Gemini API error (interests):', response.status, error);
      }
    } catch (error) {
      console.error('Error generating interests:', error);
    } finally {
      setInterestsLoading(false);
    }
  };

  const generateAiSummary = async (API_KEY, marketTitles, dislikedTitles) => {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are analyzing a user's prediction market interests on Polyflix (a Netflix-style UI for Polymarket). Based on their watchlist, write a brief, engaging 2-3 sentence profile summary describing their interests and trading personality. Be conversational and insightful.

Markets in their watchlists:
- ${marketTitles}

Markets they've disliked:
- ${dislikedTitles || 'none'}

Write ONLY the summary, no intro or labels. Keep it under 50 words.`
              }]
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const summary = text.trim();
        setAiSummary(summary);
        storeAiSummary(summary);
      } else {
        const error = await response.text();
        console.error('Gemini API error (summary):', response.status, error);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const generateCategoryBreakdown = async (API_KEY, marketTitles) => {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze these prediction market titles and categorize them. Return a JSON array of categories with percentages that add up to 100.

Markets:
- ${marketTitles}

Use these category names: Sports, Politics, Crypto, Finance, Tech, Entertainment, Science, Business, Other

Return ONLY a JSON array like this, nothing else:
[{"category": "Sports", "percentage": 40}, {"category": "Politics", "percentage": 30}, {"category": "Crypto", "percentage": 30}]`
              }]
            }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          const jsonMatch = text.match(/\[.*\]/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const filteredCategories = parsed.filter(c => c.percentage > 0).sort((a, b) => b.percentage - a.percentage);
            setCategories(filteredCategories);
            storeCategories(filteredCategories);
          }
        } catch (e) {
          console.error('Error parsing categories JSON:', e, text);
        }
      } else {
        const error = await response.text();
        console.error('Gemini API error (categories):', response.status, error);
      }
    } catch (error) {
      console.error('Error generating categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const blacklist = getBlacklist();

  // Calculate max keyword count for bar scaling
  const maxKeywordCount = keywords.length > 0 ? Math.max(...keywords.map(k => k.count)) : 1;

  return (
    <div className="profilePage">
      <div className="profilePage__headerRow">
        <div className="profilePage__header">
          <div className="profilePage__avatar">
            <svg viewBox="0 0 24 24" width="60" height="60" fill="white">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <circle cx="8" cy="9" r="1.5" fill="#141414"/>
              <circle cx="16" cy="9" r="1.5" fill="#141414"/>
              <path d="M8 14c0 2 1.5 3 4 3s4-1 4-3" stroke="#141414" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="profilePage__info">
            <h1>Mr. Buffet</h1>
            <p className="profilePage__memberSince">Polyflix Member</p>
          </div>
        </div>

        {stats.totalMarkets > 0 && (
          <div className="profilePage__aiSummary">
            <div className="profilePage__aiIcon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="profilePage__aiContent">
              <span className="profilePage__aiLabel">AI Insight</span>
              {aiLoading ? (
                <p className="profilePage__aiText profilePage__aiText--loading">
                  Analyzing your interests...
                </p>
              ) : aiSummary ? (
                <p className="profilePage__aiText">{aiSummary}</p>
              ) : (
                <p className="profilePage__aiText profilePage__aiText--empty">
                  Could not generate insight. Check console for errors.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="profilePage__sections">
        {/* Row 1: Activity (half size) + Recent Trades + Top Interests (tall) */}
        <section className="profilePage__section profilePage__section--half">
          <h2>Activity</h2>
          <p className="profilePage__sectionDesc">Your trading performance</p>
          <div className="profilePage__activityStats">
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue">68%</span>
              <span className="profilePage__activityLabel">Win Rate</span>
            </div>
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue profilePage__activityValue--positive">+$1,247</span>
              <span className="profilePage__activityLabel">Net Profit</span>
            </div>
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue profilePage__activityValue--positive">+$523</span>
              <span className="profilePage__activityLabel">Biggest Win</span>
            </div>
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue">$3,890</span>
              <span className="profilePage__activityLabel">Positions Value</span>
            </div>
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue">{stats.totalWatchlists}</span>
              <span className="profilePage__activityLabel">Watchlists</span>
            </div>
            <div className="profilePage__activityItem">
              <span className="profilePage__activityValue">{stats.totalMarkets}</span>
              <span className="profilePage__activityLabel">Markets Watched</span>
            </div>
          </div>
        </section>

        <section className="profilePage__section profilePage__section--half">
          <h2>Recent Trades</h2>
          <p className="profilePage__sectionDesc">Your latest activity</p>
          <div className="profilePage__recentTrades">
            <div className="profilePage__recentTrade">
              <div className="profilePage__recentTradeInfo">
                <span className="profilePage__recentTradeTitle">Fed decreases interest rates by 50+ bps</span>
                <span className="profilePage__recentTradeDate">2 hours ago</span>
              </div>
              <span className="profilePage__recentTradeProfit profilePage__recentTradeProfit--positive">+$125</span>
            </div>
            <div className="profilePage__recentTrade">
              <div className="profilePage__recentTradeInfo">
                <span className="profilePage__recentTradeTitle">Will Trump acquire Greenland before 2027?</span>
                <span className="profilePage__recentTradeDate">1 day ago</span>
              </div>
              <span className="profilePage__recentTradeProfit profilePage__recentTradeProfit--positive">+$89</span>
            </div>
            <div className="profilePage__recentTrade">
              <div className="profilePage__recentTradeInfo">
                <span className="profilePage__recentTradeTitle">Khamenei out as Supreme Leader of Iran</span>
                <span className="profilePage__recentTradeDate">3 days ago</span>
              </div>
              <span className="profilePage__recentTradeProfit">-$45</span>
            </div>
          </div>
        </section>

        <section className="profilePage__section profilePage__section--tall">
          <h2>Top Interests</h2>
          <p className="profilePage__sectionDesc">AI-detected themes</p>
          {interestsLoading ? (
            <p className="profilePage__aiText profilePage__aiText--loading">
              Analyzing interests...
            </p>
          ) : interests.length > 0 ? (
            <div className="profilePage__interestsList profilePage__interestsList--large">
              {interests.slice(0, 5).map((interest, idx) => {
                // Find matching keyword count for bar width
                const matchingKeyword = keywords.find(k =>
                  interest.toLowerCase().includes(k.word.toLowerCase())
                );
                const count = matchingKeyword ? matchingKeyword.count : 1;
                const barWidth = (count / maxKeywordCount) * 100;

                return (
                  <div key={idx} className="profilePage__interestItem profilePage__interestItem--large">
                    <span className="profilePage__interestRank profilePage__interestRank--large">{idx + 1}</span>
                    <div className="profilePage__interestContent">
                      <span className="profilePage__interestName profilePage__interestName--large">{interest}</span>
                      <div className="profilePage__interestBarContainer">
                        <div
                          className="profilePage__interestBar"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="profilePage__interestCount">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="profilePage__empty">
              Add markets to see your top interests.
            </p>
          )}
        </section>

        {/* Row 2: Category Breakdown + Disliked Topics side by side */}
        <div className="profilePage__sideBySide">
          <section className="profilePage__section">
            <h2>Categories</h2>
            <p className="profilePage__sectionDesc">Interest distribution</p>
            {categoriesLoading ? (
              <p className="profilePage__aiText profilePage__aiText--loading">
                Analyzing...
              </p>
            ) : categories.length > 0 ? (
              <div className="profilePage__categories">
                <div className="profilePage__categoryBars">
                  {categories.slice(0, 4).map(({ category, percentage }) => (
                    <div key={category} className="profilePage__categoryRow">
                      <span className="profilePage__categoryName">{category}</span>
                      <div className="profilePage__categoryBarContainer">
                        <div
                          className="profilePage__categoryBar"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category)
                          }}
                        />
                      </div>
                      <span className="profilePage__categoryPercent">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="profilePage__empty">
                Add markets to see categories.
              </p>
            )}
          </section>

          <section className="profilePage__section">
            <h2>Disliked Topics</h2>
            <p className="profilePage__sectionDesc">Filtered out</p>
            {blacklist.length > 0 ? (
              <div className="profilePage__dislikes">
                {blacklist.slice(0, 5).map((market) => (
                  <span key={market.id} className="profilePage__dislike">
                    {market.title.length > 30
                      ? market.title.substring(0, 30) + '...'
                      : market.title}
                  </span>
                ))}
                {blacklist.length > 5 && (
                  <span className="profilePage__dislikeMore">
                    +{blacklist.length - 5} more
                  </span>
                )}
              </div>
            ) : (
              <p className="profilePage__empty">
                No disliked markets yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
