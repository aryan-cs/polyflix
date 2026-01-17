import React from 'react';
import './MoreInfoButton.css';

function MoreInfoButton({ onClick }) {
  return (
    <button className="more-info-button" onClick={onClick}>
      ℹ More Info
    </button>
  );
}

export default MoreInfoButton;
