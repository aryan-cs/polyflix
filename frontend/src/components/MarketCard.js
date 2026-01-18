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
      className="marketCard"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        className="marketCard__image"
        src={market.image}
        alt={market.title}
        onClick={handleOpen}
      />
      
      <div
        className={`marketCard__overlay ${isHovered ? 'marketCard__overlay--visible' : ''}`}
        onClick={handleOpen}
      >
        <div className="marketCard__content">
          <h3 className="marketCard__title">{market.title}</h3>
          
          {priceItems.length > 0 && (
            <div className="marketCard__prices">
              {priceItems.map((outcome, index) => (
                <div
                  key={`${outcome.label}-${index}`}
                  className={`marketCard__price ${
                    index === 0
                      ? 'marketCard__price--yes'
                      : 'marketCard__price--no'
                  }`}
                >
                  <span className="marketCard__price-label">
                    {outcome.label}
                  </span>
                  <span className="marketCard__price-value">
                    {outcome.price}¢
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="marketCard__stats">
            <div className="marketCard__stat">
              <span className="marketCard__stat-label">Volume</span>
              <span className="marketCard__stat-value">${market.volume}</span>
            </div>
            <div className="marketCard__stat">
              <span className="marketCard__stat-label">Liquidity</span>
              <span className="marketCard__stat-value">${market.liquidity}</span>
            </div>
          </div>

          <div className="marketCard__meta">
            <span className="marketCard__category">{market.category}</span>
            <span className="marketCard__end">Ends {market.endDate}</span>
          </div>

          <button
            className="marketCard__button"
            onClick={(event) => event.stopPropagation()}
          >
            Trade Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarketCard;
