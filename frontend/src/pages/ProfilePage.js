import React, { useState, useEffect } from 'react';
import { getWatchlists, getBlacklist } from './MyWatchlists';
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

function ProfilePage() {
  const [keywords, setKeywords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalWatchlists: 0,
    totalMarkets: 0,
    totalDislikes: 0
  });
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

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

    // Generate AI-powered content if we have data
    if (allMarkets.length > 0) {
      generateAiContent(allMarkets, loadedBlacklist);
    }
  }, []);

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
  };

  const generateAiSummary = async (API_KEY, marketTitles, dislikedTitles) => {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
        setAiSummary(text.trim());
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
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
            setCategories(parsed.filter(c => c.percentage > 0).sort((a, b) => b.percentage - a.percentage));
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

  return (
    <div className="profilePage">
      <div className="profilePage__header">
        <div className="profilePage__avatar">
          <span>P</span>
        </div>
        <div className="profilePage__info">
          <h1>Profile</h1>
          <p className="profilePage__memberSince">Polyflix Member</p>
        </div>
      </div>

      <div className="profilePage__stats">
        <div className="profilePage__statCard">
          <span className="profilePage__statNumber">{stats.totalWatchlists}</span>
          <span className="profilePage__statLabel">Watchlists</span>
        </div>
        <div className="profilePage__statCard">
          <span className="profilePage__statNumber">{stats.totalMarkets}</span>
          <span className="profilePage__statLabel">Markets Watched</span>
        </div>
        <div className="profilePage__statCard">
          <span className="profilePage__statNumber">{stats.totalDislikes}</span>
          <span className="profilePage__statLabel">Dislikes</span>
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

      <div className="profilePage__sections">
        <section className="profilePage__section">
          <h2>Your Interests</h2>
          <p className="profilePage__sectionDesc">Keywords extracted from your watchlists</p>
          {keywords.length > 0 ? (
            <div className="profilePage__keywords">
              {keywords.map(({ word, count }) => (
                <span
                  key={word}
                  className="profilePage__keyword"
                  style={{
                    fontSize: `${Math.min(1.4, 0.9 + (count * 0.1))}rem`,
                    opacity: Math.min(1, 0.6 + (count * 0.1))
                  }}
                >
                  {word}
                  <span className="profilePage__keywordCount">{count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="profilePage__empty">
              Add markets to your watchlists to see your interests here.
            </p>
          )}
        </section>

        <section className="profilePage__section">
          <h2>Category Breakdown</h2>
          <p className="profilePage__sectionDesc">How your interests are distributed (AI-powered)</p>
          {categoriesLoading ? (
            <p className="profilePage__aiText profilePage__aiText--loading">
              Analyzing categories...
            </p>
          ) : categories.length > 0 ? (
            <div className="profilePage__categories">
              <div className="profilePage__categoryBars">
                {categories.map(({ category, percentage }) => (
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
              Add markets to your watchlists to see your category breakdown.
            </p>
          )}
        </section>

        <section className="profilePage__section">
          <h2>Disliked Topics</h2>
          <p className="profilePage__sectionDesc">Markets you're not interested in</p>
          {blacklist.length > 0 ? (
            <div className="profilePage__dislikes">
              {blacklist.slice(0, 10).map((market) => (
                <span key={market.id} className="profilePage__dislike">
                  {market.title.length > 40
                    ? market.title.substring(0, 40) + '...'
                    : market.title}
                </span>
              ))}
              {blacklist.length > 10 && (
                <span className="profilePage__dislikeMore">
                  +{blacklist.length - 10} more
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
  );
}

export default ProfilePage;
