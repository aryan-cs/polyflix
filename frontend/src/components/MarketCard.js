import React, { useState } from 'react';
import './MarketCard.css';

function MarketCard({ market, onSelectMarket }) {
  const [isHovered, setIsHovered] = useState(false);
  const handleOpen = () => {
    if (onSelectMarket) {
      onSelectMarket(market);
    }
  };
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
    <div
      className={`marketCard ${isHovered ? 'marketCard--expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        className="marketCard__image"
        src={market.image}
        alt={market.title}
        onClick={handleOpen}
      />
      {isHovered && (
        <div className="marketCard__panel" onClick={handleOpen}>
          <div className="marketCard__content">
            <h3 className="marketCard__title">{market.title}</h3>

            <div className="marketCard__actions" onClick={(e) => e.stopPropagation()}>
              <div className="marketCard__actions-left">
                <button className="marketCard__control marketCard__control--primary" aria-label="Play">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7-11-7z"></path>
                  </svg>
                </button>
                <button className="marketCard__control" aria-label="Add to My List">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                  </svg>
                </button>
                <button className="marketCard__control" aria-label="Like">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M2 14h4v8H2v-8zm6 8h8a3 3 0 0 0 3-3v-6.5a2.5 2.5 0 0 0-2.5-2.5H14l1-4a2 2 0 0 0-2-2h-1.5a1.5 1.5 0 0 0-1.5 1.2L8 9.5V22z"></path>
                  </svg>
                </button>
              </div>
              <button className="marketCard__control marketCard__control--right" aria-label="More">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6"></path>
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
  );
}

export default MarketCard;
