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

        <h2 className="banner__description">
          {truncate(market?.description, 200)}
        </h2>
        
        <div className="banner__buttons">
          <TradeNowButton />
          <MoreInfoButton onClick={onMoreInfo} />
        </div>
      </div>
      <div className="banner--fadeBottom" />
    </header>
  );
}

export default Banner;
