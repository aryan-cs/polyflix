import React, { useState, useEffect, useRef } from 'react';
import './MarketCard.css';
import realImage from './ticket4.svg';

// Extract keywords from market title
function extractKeywords(title) {
  if (!title) return ['Market', 'Prediction'];
  
  const stopWords = ['will', 'market', 'the', 'by', 'end', 'of', 'before', 'after', 'reach', 'price', 'and', 'or', 'to', 'a', 'an', 'in', 'on', 'at', 'for', 'with', 'from'];
  // Match words that are 3+ characters and don't contain numbers
  const words = title.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
  let keywords = words.filter(word => !stopWords.includes(word));
  
  // Ensure we have 2-3 keywords
  if (keywords.length < 2) {
    // Add fallback words if we don't have enough
    const fallbacks = ['Market', 'Prediction', 'Event'];
    keywords = [...keywords, ...fallbacks].slice(0, 3);
  } else if (keywords.length > 3) {
    keywords = keywords.slice(0, 3);
  }
  
  return keywords.length >= 2 ? keywords : ['Market', 'Prediction'];
}

// Calculate time until resolution
function getTimeUntilResolution(endDate) {
  if (!endDate) return 'TBD';
  
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 365) {
      const years = Math.floor(days / 365);
      return `${years}y`;
    } else if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months}mo`;
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  } catch {
    return 'TBD';
  }
}

// Get market status
function getMarketStatus(market) {
  const endDate = market.endDate || market.end_date;
  if (!endDate) return 'ACTIVE';
  
  try {
    const end = new Date(endDate);
    const now = new Date();
    return end.getTime() > now.getTime() ? 'ACTIVE' : 'CLOSED';
  } catch {
    return 'ACTIVE';
  }
}

// Get market category/tag
function getMarketTag(market) {
  const category = market.category;
  if (category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  
  const title = (market.title || market.question || '').toLowerCase();
  if (title.includes('bitcoin') || title.includes('crypto')) return 'Crypto';
  if (title.includes('trump') || title.includes('election')) return 'Politics';
  if (title.includes('sports') || title.includes('nba')) return 'Sports';
  if (title.includes('stock') || title.includes('earnings')) return 'Finance';
  
  return 'Market';
}

function MarketCard({ market, onSelectMarket }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimer = useRef(null);

  // Normalize title - API returns "question", mock data uses "title"
  const marketTitle = market.title || market.question || '';

  const handleOpen = () => {
    if (onSelectMarket) {
      onSelectMarket(market);
    }
  };

  useEffect(() => {
    if (isHovered && !videoId) {
      console.log(`🖱️ Hovered market: ${marketTitle}`);
      // Fetch video on first hover
      const fetchVideo = async () => {
        try {
          console.log(`🔍 Fetching video for: ${marketTitle}`);
          const res = await fetch(`http://localhost:5002/api/video/search?query=${encodeURIComponent(marketTitle)}`);
          if (res.ok) {
            const data = await res.json();
            console.log(`✅ Got video ID: ${data.videoId}`);
            if (data.videoId) setVideoId(data.videoId);
          } else {
            console.error(`❌ Fetch failed with status: ${res.status}`);
          }
        } catch (err) {
          console.error("❌ Video fetch network error", err);
        }
      };
      
      // Delay fetching slightly to avoid spamming if user just moused over quickly
      const fetchTimer = setTimeout(fetchVideo, 500);
      return () => clearTimeout(fetchTimer);
    }
  }, [isHovered, marketTitle, videoId]);

  useEffect(() => {
    if (isHovered) {
      // Start timer to show video after expansion completes
      hoverTimer.current = setTimeout(() => {
        setShowVideo(true);
      }, 1000); // 1s delay
    } else {
      clearTimeout(hoverTimer.current);
      setShowVideo(false);
    }
    return () => clearTimeout(hoverTimer.current);
  }, [isHovered]);

  const showOutcomePairs =
    Array.isArray(market?.outcomePairs) &&
    market.outcomePairs.length > 0 &&
    !market?.hasBinaryOutcomes;
  const priceItems = showOutcomePairs
    ? market.outcomePairs.slice(0, 2)
    : [
        { label: 'YES', price: market?.yesPrice },
        { label: 'NO', price: market?.noPrice },
      ].filter((outcome) => Number.isFinite(outcome.price));

  return (
    <div className="marketCard-wrapper" 
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      <div
        className={`marketCard ${isHovered ? 'marketCard--expanded' : ''}`}
      >
        <div className="marketCard__imageContainer">
          {videoId && showVideo && isHovered ? (
             <div className="marketCard__videoWrapper">
               <iframe
                 src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}`}
                 title={marketTitle}
                 frameBorder="0"
                 allow="autoplay; encrypted-media"
                 className="marketCard__video"
               />
             </div>
          ) : market.image ? (
            <>
              <img
                className="marketCard__image"
                src={market.image}
                alt={marketTitle}
                onClick={handleOpen}
              />
              <div className="marketCard__imageTitle">
                {marketTitle}
              </div>
            </>
          ) : (
            <div className="marketCard__placeholder" onClick={handleOpen}>
              <span className="marketCard__placeholderTitle">{marketTitle}</span>
            </div>
          )}
        </div>
        {isHovered && (
          <div className="marketCard__panel" onClick={handleOpen}>
            <div className="marketCard__content">
              <div className="marketCard__actions" onClick={(e) => e.stopPropagation()}>
                <div className="marketCard__actions-left">
                  <button className="marketCard__control marketCard__control--primary" aria-label="Play">
                    <img src={realImage} alt="Play" style={{ width: '24px', height: '24px', filter: 'hue-rotate(0deg) saturate(0.3) brightness(1.2)' }} />
                  </button>
                  <button className="marketCard__control" aria-label="Add to My List">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10V8.2c0-1.12 0-1.68.218-2.108a2 2 0 01.874-.874C4.52 5 5.08 5 6.2 5h11.6c1.12 0 1.68 0 2.108.218a2 2 0 01.874.874C21 6.52 21 7.08 21 8.2V10m-18 0h18m-18 0v6.8c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C4.52 19 5.08 19 6.2 19h11.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C21 17.48 21 16.92 21 15.8V10M9 13h1m4 0h1"/>
                    </svg>
                  </button>
                  <button className="marketCard__control" aria-label="Like">
                    <svg viewBox="0 0 24 24" width="24" height="24" data-icon="ThumbsUpMedium" aria-hidden="true" fill="none">
                      <path fill="currentColor" fillRule="evenodd" d="M10.696 8.773A2 2 0 0 0 11 7.713V4h.838c.877 0 1.59.553 1.77 1.311C13.822 6.228 14 7.227 14 8a7 7 0 0 1-.246 1.75L13.432 11H17.5a1.5 1.5 0 0 1 1.476 1.77l-.08.445.28.354c.203.256.324.578.324.931s-.12.675-.324.93l-.28.355.08.445q.024.13.024.27c0 .49-.234.925-.6 1.2l-.4.3v.5a1.5 1.5 0 0 1-1.5 1.5h-3.877a9 9 0 0 1-2.846-.462l-1.493-.497A10.5 10.5 0 0 0 5 18.5v-4.747l2.036-.581a3 3 0 0 0 1.72-1.295zM10.5 2A1.5 1.5 0 0 0 9 3.5v4.213l-1.94 3.105a1 1 0 0 1-.574.432l-2.035.581A2 2 0 0 0 3 13.754v4.793c0 1.078.874 1.953 1.953 1.953.917 0 1.828.148 2.698.438l1.493.498a11 11 0 0 0 3.479.564H16.5a3.5 3.5 0 0 0 3.467-3.017 3.5 3.5 0 0 0 1.028-2.671c.32-.529.505-1.15.505-1.812s-.185-1.283-.505-1.812Q21 12.595 21 12.5A3.5 3.5 0 0 0 17.5 9h-1.566c.041-.325.066-.66.066-1 0-1.011-.221-2.194-.446-3.148C15.14 3.097 13.543 2 11.838 2z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                <button className="marketCard__control marketCard__control--right" aria-label="More">
                  <svg viewBox="0 0 24 24" width="24" height="24" data-icon="ChevronDownMedium" aria-hidden="true" fill="none">
                    <path fill="currentColor" fillRule="evenodd" d="m12 15.586 7.293-7.293 1.414 1.414-8 8a1 1 0 0 1-1.414 0l-8-8 1.414-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>

              <div className="marketCard__metaRow">
                <span className="marketCard__rating">{getMarketTag(market)}</span>
                <span className="marketCard__duration">{getTimeUntilResolution(market.endDate || market.end_date)}</span>
                <span 
                  className="marketCard__status" 
                  data-status={getMarketStatus(market)}
                >
                  {getMarketStatus(market)}
                </span>
              </div>

              <div className="marketCard__tags">
                {extractKeywords(marketTitle).map((keyword, index, array) => (
                  <React.Fragment key={keyword}>
                    <span>{keyword.charAt(0).toUpperCase() + keyword.slice(1)}</span>
                    {index < array.length - 1 && <span>•</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="marketCard__priceInline">
                <span className="marketCard__priceValue">YES {market?.yesPrice || '50'}¢</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketCard;
