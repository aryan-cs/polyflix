import React from 'react';
import './TradeButton.css';

function TradeButton({ optionA = "Option A", optionB = "Option B", onClick }) {
  return (
    <button
      className="trade-button"
      onClick={onClick}
    >
      <div className="trade-button__option trade-button__option--yes">
        {optionA}
      </div>
      <div className="trade-button__option trade-button__option--no">
        {optionB}
      </div>
    </button>
  );
}

export default TradeButton;
