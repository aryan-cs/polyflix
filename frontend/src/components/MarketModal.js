import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MarketModal.css';
import { getWatchlists, addMarketToWatchlist, removeMarketFromWatchlist } from '../pages/MyWatchlists';

function MarketModal({ market, onClose, watchlists: propWatchlists, onToggleWatchlist }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('Yes');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('');
  const [yesPrice, setYesPrice] = useState(0);
  const [noPrice, setNoPrice] = useState(0);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [checkedWatchlists, setCheckedWatchlists] = useState(new Set());
  const [watchlists, setWatchlists] = useState([]);

  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const bodyRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load watchlists - use props if provided, otherwise load from localStorage
  useEffect(() => {
    if (propWatchlists && propWatchlists.length > 0) {
      setWatchlists(propWatchlists);
    } else {
      setWatchlists(getWatchlists());
    }
  }, [propWatchlists]);

  // Initialize checked watchlists when market or watchlists change
  useEffect(() => {
    if (!market || watchlists.length === 0) return;

    // Find which watchlists already contain this market
    const containingWatchlists = watchlists
      .filter(w => w.markets.some(m => m.id === market.id))
      .map(w => w.id);

    setCheckedWatchlists(new Set(containingWatchlists));
  }, [market, watchlists]);

  // Log market on open
  useEffect(() => {
    if (!market) return;

    setIsClosing(false);
    setIsExpanded(false);
    setShowWatchlistDropdown(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [market]);

  // Parse prices from Gamma API data
  useEffect(() => {
    if (!market) return;

    // outcomePrices comes as a JSON string from Gamma API like "[\"0.029\", \"0.971\"]"
    let prices = market.outcomePrices;

    // Parse if it's a string
    if (typeof prices === 'string') {
      try {
        prices = JSON.parse(prices);
      } catch (e) {
        prices = null;
      }
    }

    if (Array.isArray(prices) && prices.length >= 2) {
      setYesPrice(Math.round(parseFloat(prices[0]) * 100));
      setNoPrice(Math.round(parseFloat(prices[1]) * 100));
    } else {
      // Fallback to 50/50 if no price data
      setYesPrice(50);
      setNoPrice(50);
    }
  }, [market]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowWatchlistDropdown(false);
      }
    };

    if (showWatchlistDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWatchlistDropdown]);

  const handleClose = useCallback(() => {
    setIsClosing((prev) => {
      if (prev) return prev;
      closeTimerRef.current = window.setTimeout(() => {
        onCloseRef.current();
      }, 250);
      return true;
    });
  }, []);

  const handleTrade = () => {
    // Trading not implemented - would require wallet connection
  };

  const handleToggleWatchlist = (watchlistId) => {
    const isCurrentlyChecked = checkedWatchlists.has(watchlistId);
    const newChecked = new Set(checkedWatchlists);

    if (isCurrentlyChecked) {
      newChecked.delete(watchlistId);
      // If we have a callback from parent (MyWatchlists page), use it
      if (onToggleWatchlist) {
        onToggleWatchlist(watchlistId, market, false);
      } else {
        // Otherwise update localStorage directly
        const updated = removeMarketFromWatchlist(watchlistId, market.id);
        setWatchlists(updated);
      }
    } else {
      newChecked.add(watchlistId);
      if (onToggleWatchlist) {
        onToggleWatchlist(watchlistId, market, true);
      } else {
        const updated = addMarketToWatchlist(watchlistId, market);
        setWatchlists(updated);
      }
    }

    setCheckedWatchlists(newChecked);
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!market) return null;

  const description = market.question || 'No description available yet for this market.';
  const shouldTruncate = description.length > 220;
  const visibleDescription =
    !shouldTruncate || isExpanded
      ? description
      : `${description.slice(0, 200).trim()}...`;

  const outcomePairs = Array.isArray(market.outcomePairs)
    ? market.outcomePairs
    : [];
  const showOutcomeList = outcomePairs.length > 0 && !market.hasBinaryOutcomes;

  const volume = market.volumeNum ? `$${(market.volumeNum / 1000000).toFixed(1)}M` : '—';

  const watchlistCount = checkedWatchlists.size;

  return (
    <div
      className={`marketModal ${isClosing ? 'marketModal--closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className="marketModal__dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="marketModal__close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className="marketModal__hero"
          style={{ backgroundImage: `url(${market.image})` }}
        />

        <div className="marketModal__body" ref={bodyRef}>
          <h2 className="marketModal__title">{market.title || market.question}</h2>

          <div className="marketModal__meta">
            <span className="marketModal__badge">{market.category || 'Market'}</span>
            <span className="marketModal__end">
              Ends {market.endDate || 'TBD'}
            </span>
            <div className="marketModal__watchlist-container" ref={dropdownRef}>
              <button
                className={`marketModal__watchlist-btn ${watchlistCount > 0 ? 'marketModal__watchlist-btn--active' : ''}`}
                onClick={() => setShowWatchlistDropdown(!showWatchlistDropdown)}
              >
                {watchlistCount > 0 ? `★ In ${watchlistCount} List${watchlistCount > 1 ? 's' : ''}` : '+ Watchlist'}
              </button>

              {showWatchlistDropdown && (
                <div className="marketModal__watchlist-dropdown">
                  <div className="marketModal__watchlist-header">
                    Add to Watchlist
                  </div>
                  {watchlists.length === 0 ? (
                    <div className="marketModal__watchlist-empty">
                      <p>No watchlists yet.</p>
                      <p>Go to My Watchlists to create one!</p>
                    </div>
                  ) : (
                    <div className="marketModal__watchlist-list">
                      {watchlists.map((watchlist) => (
                        <label key={watchlist.id} className="marketModal__watchlist-item">
                          <input
                            type="checkbox"
                            checked={checkedWatchlists.has(watchlist.id)}
                            onChange={() => handleToggleWatchlist(watchlist.id)}
                          />
                          <span className="marketModal__watchlist-checkbox">
                            {checkedWatchlists.has(watchlist.id) && '✓'}
                          </span>
                          <span className="marketModal__watchlist-name">{watchlist.name}</span>
                          <span className="marketModal__watchlist-count">
                            {watchlist.markets.length}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="marketModal__description">
            {visibleDescription}
            {shouldTruncate && (
              <button
                className="marketModal__readMore"
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </p>

          {showOutcomeList ? (
            <>
              <div className="marketModal__outcomes">
                <h4 className="marketModal__outcomes-title">Outcomes</h4>
                <div className="marketModal__outcomes-list">
                  {outcomePairs.map((outcome, index) => (
                    <div key={`${outcome.label}-${index}`} className="marketModal__outcome">
                      <span className="marketModal__outcome-name">
                        {outcome.label}
                      </span>
                      <span className="marketModal__outcome-price">
                        {outcome.price}¢
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="marketModal__stats marketModal__stats--compact">
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Volume</span>
                  <span className="marketModal__stat-value">{volume}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="marketModal__trading-panel">
              <div className="marketModal__stats">
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Yes</span>
                  <span className="marketModal__stat-value marketModal__stat-value--yes">
                    {yesPrice}¢
                  </span>
                </div>
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">No</span>
                  <span className="marketModal__stat-value marketModal__stat-value--no">
                    {noPrice}¢
                  </span>
                </div>
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Volume</span>
                  <span className="marketModal__stat-value">{volume}</span>
                </div>
              </div>

              <div className="marketModal__trading-form">
                <div className="marketModal__form-group">
                  <label>Outcome</label>
                  <div className="marketModal__outcome-buttons">
                    <button
                      className={`marketModal__outcome-btn ${selectedOutcome === 'Yes' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('Yes')}
                    >
                      Yes ({yesPrice}¢)
                    </button>
                    <button
                      className={`marketModal__outcome-btn ${selectedOutcome === 'No' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('No')}
                    >
                      No ({noPrice}¢)
                    </button>
                  </div>
                </div>

                <div className="marketModal__form-group">
                  <label>Limit Price (¢)</label>
                  <input
                    type="number"
                    placeholder="Enter limit price"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    min="1"
                    max="99"
                  />
                </div>

                <div className="marketModal__form-group">
                  <label>Shares</label>
                  <input
                    type="number"
                    placeholder="Enter number of shares"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            className="marketModal__cta"
            onClick={handleTrade}
          >
            Trade Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarketModal;
