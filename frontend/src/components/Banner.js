import React from 'react';
import './Banner.css';
import TradeNowButton from './TradeNowButton';
import MoreInfoButton from './MoreInfoButton';

function Banner({ market, onMoreInfo }) {
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + '...' : str;
  };

  return (
    <header
      className="banner"
      style={{
        backgroundImage: `url(${market?.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
      }}
    >
      <div className="banner__contents">
        <h1 className="banner__title">{market?.title}</h1>
        
        <div className="banner__buttons">
          <TradeNowButton />
          <MoreInfoButton onClick={onMoreInfo} />
        </div>

        <div className="banner__stats">
          <div className="banner__stat">
            <span className="banner__stat-label">Yes</span>
            <span className="banner__stat-value" style={{color: '#10b981'}}>
              {market?.yesPrice}%
            </span>
          </div>
          <div className="banner__stat">
            <span className="banner__stat-label">No</span>
            <span className="banner__stat-value" style={{color: '#ef4444'}}>
              {market?.noPrice}%
            </span>
          </div>
          <div className="banner__stat">
            <span className="banner__stat-label">Volume</span>
            <span className="banner__stat-value">${market?.volume}</span>
          </div>
          <div className="banner__stat">
            <span className="banner__stat-label">Ends</span>
            <span className="banner__stat-value">{market?.endDate}</span>
          </div>
        </div>

        <h2 className="banner__description">
          {truncate(market?.description, 200)}
        </h2>
      </div>
    </header>
  );
}

export default Banner;
