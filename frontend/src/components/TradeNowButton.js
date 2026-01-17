import React from 'react';
import './TradeNowButton.css';

function TradeNowButton({ onClick }) {
  return (
    <button className="trade-now-button" onClick={onClick}>
      ▶ Trade Now
    </button>
  );
}

export default TradeNowButton;
