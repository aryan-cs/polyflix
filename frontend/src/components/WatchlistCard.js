import React from 'react';
import './WatchlistCard.css';

function WatchlistCard({ watchlist, onClick }) {
  // Create a collage effect by showing up to 4 market images
  const collageImages = watchlist.markets.slice(0, 4).map(m => m.image);
  const isEmpty = watchlist.markets.length === 0;
  const firstLetter = watchlist.name.charAt(0).toUpperCase();

  return (
    <div className="watchlistCard" onClick={onClick}>
      <div className="watchlistCard__imageContainer">
        {isEmpty ? (
          <div className="watchlistCard__empty">
            <div className="watchlistCard__emptyIcon">
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="watchlistCard__emptyInitial">{firstLetter}</div>
          </div>
        ) : collageImages.length <= 1 ? (
          <img
            className="watchlistCard__image"
            src={watchlist.markets[0].image}
            alt={watchlist.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('watchlistCard__imageContainer--error');
            }}
          />
        ) : (
          <div className={`watchlistCard__collage watchlistCard__collage--${Math.min(collageImages.length, 4)}`}>
            {collageImages.map((img, index) => (
              <img
                key={index}
                className="watchlistCard__collageImage"
                src={img}
                alt=""
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}
        <div className="watchlistCard__overlay">
          <div className="watchlistCard__playIcon">
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="watchlistCard__info">
        <h3 className="watchlistCard__title">{watchlist.name}</h3>
        <span className="watchlistCard__count">
          {watchlist.markets.length} {watchlist.markets.length === 1 ? 'market' : 'markets'}
        </span>
      </div>
    </div>
  );
}

export default WatchlistCard;
