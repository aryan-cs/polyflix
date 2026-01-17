import React, { useState } from 'react';
import './MarketCard.css';

function MarketCard({ market }) {
  const [isHovered, setIsHovered] = useState(false);

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
      />
      
      <div className={`marketCard__overlay ${isHovered ? 'marketCard__overlay--visible' : ''}`}>
        <div className="marketCard__content">
          <h3 className="marketCard__title">{market.title}</h3>
          
          <div className="marketCard__prices">
            <div className="marketCard__price marketCard__price--yes">
              <span className="marketCard__price-label">YES</span>
              <span className="marketCard__price-value">{market.yesPrice}¢</span>
            </div>
            <div className="marketCard__price marketCard__price--no">
              <span className="marketCard__price-label">NO</span>
              <span className="marketCard__price-value">{market.noPrice}¢</span>
            </div>
          </div>

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

          <button className="marketCard__button">Trade Now</button>
        </div>
      </div>
    </div>
  );
}

export default MarketCard;
