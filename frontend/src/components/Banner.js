import React from 'react';
import './Banner.css';
import TradeButton from './TradeButton';
import MoreInfoButton from './MoreInfoButton';

function Banner({ market }) {
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
          {market?.description.match(/^.*?[\.!?]/)[0].trim()}
        </h2>
        
        <div className="banner__buttons">
          <TradeButton 
            url={market?.url} 
            optionA={market?.optionA || "Yes"} 
            optionB={market?.optionB || "No"} 
          />
          <MoreInfoButton />
        </div>
      </div>
      <div className="banner--fadeBottom" />
    </header>
  );
}

export default Banner;
