import React from 'react';
import './TradeButton.css';

function TradeButton({ url, optionA = "Option A", optionB = "Option B" }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="trade-button"
    >
      <div className="trade-button__option trade-button__option--yes">
        {optionA}
      </div>
      <div className="trade-button__option trade-button__option--no">
        {optionB}
      </div>
    </a>
  );
}

export default TradeButton;
