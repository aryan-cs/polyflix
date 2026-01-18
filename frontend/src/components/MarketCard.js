import React, { useState, useEffect, useRef } from 'react';
import './MarketCard.css';
import realImage from './images3.svg';

function MarketCard({ market, onSelectMarket }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimer = useRef(null);

  const handleOpen = () => {
    if (onSelectMarket) {
      onSelectMarket(market);
    }
  };

  useEffect(() => {
    if (isHovered && !videoId) {
      console.log(`🖱️ Hovered market: ${market.title}`);
      // Fetch video on first hover
      const fetchVideo = async () => {
        try {
          console.log(`🔍 Fetching video for: ${market.title}`);
          const res = await fetch(`http://localhost:5002/api/video/search?query=${encodeURIComponent(market.title)}`);
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
  }, [isHovered, market.title, videoId]);

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
                 title={market.title}
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
                alt={market.title}
                onClick={handleOpen}
              />
              <div className="marketCard__imageTitle">
                {market.title}
              </div>
            </>
          ) : (
            <div className="marketCard__placeholder" onClick={handleOpen}>
              <span className="marketCard__placeholderTitle">{market.title}</span>
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
                    <svg viewBox="0 0 24 24" width="24" height="24" data-icon="PlusMedium" aria-hidden="true" fill="none">
                      <path fill="currentColor" fillRule="evenodd" d="M11 11V2h2v9h9v2h-9v9h-2v-9H2v-2z" clipRule="evenodd"></path>
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
                <span className="marketCard__rating">R</span>
                <span className="marketCard__duration">3h</span>
                <span className="marketCard__hd">HD</span>
              </div>

              <div className="marketCard__tags">
                <span>Slick</span>
                <span>•</span>
                <span>Raunchy</span>
                <span>•</span>
                <span>Dark Comedy</span>
              </div>

              <div className="marketCard__priceInline">
                <span className="marketCard__priceLabel">YES</span>
                <span className="marketCard__priceValue">{priceItems?.[0]?.price ?? market?.yesPrice}¢</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketCard;
