import React, { useRef, useState } from 'react';
import './MarketRow.css';
import MarketCard from './MarketCard';

function MarketRow({ title, markets, onSelectMarket }) {
  const rowRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);

  const handleScroll = (direction) => {
    const container = rowRef.current;
    const scrollAmount = container.offsetWidth - 80;

    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
      setScrollX(scrollX - scrollAmount);
    } else {
      container.scrollLeft += scrollAmount;
      setScrollX(scrollX + scrollAmount);
    }
  };

  return (
    <div className="row">
      <h2 className="row__title">{title}</h2>
      <div className="row__container">
        <button 
          className="row__button row__button--left"
          onClick={() => handleScroll('left')}
          style={{display: scrollX <= 0 ? 'none' : 'block'}}
        >
          ‹
        </button>
        
        <div className="row__posters" ref={rowRef}>
          {markets?.map((market) => (
            <MarketCard key={market.id} market={market} onSelectMarket={onSelectMarket} />
          ))}
        </div>

        <button 
          className="row__button row__button--right"
          onClick={() => handleScroll('right')}
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default MarketRow;
