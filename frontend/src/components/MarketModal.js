import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MarketModal.css';

function MarketModal({ market, onClose, watchlists = [], onAddToWatchlist }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('Yes');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [yesPrice, setYesPrice] = useState(0);
  const [noPrice, setNoPrice] = useState(0);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [selectedWatchlistIds, setSelectedWatchlistIds] = useState(new Set());
  
  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const bodyRef = useRef(null);
  const dropdownRef = useRef(null);

  // Log market on open
  useEffect(() => {
    if (!market) return;
    
    console.log('🎯 Full market object:', market);
    console.log('📋 Market keys:', Object.keys(market));
    console.log('🔑 ID fields:', {
      id: market.id,
      conditionId: market.conditionId,
      slug: market.slug,
      clobTokenIds: market.clobTokenIds,
      outcomePrices: market.outcomePrices,
    });
    console.log('📋 Watchlists received in MarketModal:', watchlists);
    console.log('📋 Watchlists length:', watchlists.length);
    
    setIsClosing(false);
    setIsExpanded(false);
    setSelectedWatchlistIds(new Set());
    setShowWatchlistDropdown(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [market, watchlists]);

  // Fetch real prices from CLOB API
  useEffect(() => {
    if (!market) return;
    
    const fetchPrices = async () => {
      const tokenId = market?.clobTokenIds?.[0];
      
      console.log('🔍 market.clobTokenIds:', market?.clobTokenIds);
      console.log('🔍 tokenId extracted:', tokenId);
      
      if (!tokenId) {
        console.log('❌ No clobTokenId available');
        return;
      }
      
      console.log('🔍 Fetching prices for tokenId:', tokenId);
      
      try {
        // Use tokenId to get the specific market directly
        const url = `https://clob.polymarket.com/markets/${tokenId}`;
        console.log('📡 Calling CLOB API:', url);
        
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        
        console.log('✅ CLOB API Response Status:', response.status);
        
        if (response.ok) {
          const marketData = await response.json();
          console.log('📊 Market data from CLOB:', marketData);
          
          if (marketData.orderBook?.bids?.[0]?.[0]) {
            const yesBid = marketData.orderBook.bids[0][0];
            console.log('💰 Yes Price from CLOB:', yesBid);
            setYesPrice(Math.round(yesBid * 100));
            setNoPrice(Math.round((1 - yesBid) * 100));
          } else if (marketData.bestBid !== undefined && marketData.bestAsk !== undefined) {
            // Fallback to best bid/ask
            const price = (parseFloat(marketData.bestBid) + parseFloat(marketData.bestAsk)) / 2;
            console.log('💰 Price from bestBid/bestAsk:', price);
            setYesPrice(Math.round(price * 100));
            setNoPrice(Math.round((1 - price) * 100));
          } else {
            console.log('⚠️ No price data in market');
            throw new Error('No orderBook data');
          }
        } else {
          console.log('❌ CLOB API Error:', response.statusText);
          throw new Error(response.statusText);
        }
      } catch (error) {
        console.error('❌ CLOB Fetch Error:', error);
        console.log('📈 Falling back to outcomePrices:', market?.outcomePrices);
        
        if (market?.outcomePrices && Array.isArray(market.outcomePrices)) {
          console.log('💰 Using fallback prices:', market.outcomePrices);
          setYesPrice(Math.round(parseFloat(market.outcomePrices[0]) * 100));
          setNoPrice(Math.round(parseFloat(market.outcomePrices[1]) * 100));
        }
      }
    };

    fetchPrices();
  }, [market?.clobTokenIds?.[0], market?.outcomePrices]);

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

  const handleTrade = async () => {
    if (!limitPrice || !shares) {
      alert('Please enter limit price and shares');
      return;
    }
    setIsTrading(true);
    try {
      const response = await fetch('https://clob.polymarket.com/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: market.clobTokenIds?.[0],
          side: selectedOutcome === 'Yes' ? 'BUY' : 'SELL',
          limitPrice: parseFloat(limitPrice) / 100,
          quantity: parseInt(shares),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        alert('Order placed successfully!');
        setLimitPrice('');
        setShares('');
      } else {
        alert('Failed to place order');
      }
    } catch (error) {
      console.error('Trading error:', error);
      alert('Error placing order');
    } finally {
      setIsTrading(false);
    }
  };

  const handleToggleWatchlist = (watchlistId) => {
    const newSelected = new Set(selectedWatchlistIds);
    if (newSelected.has(watchlistId)) {
      newSelected.delete(watchlistId);
    } else {
      newSelected.add(watchlistId);
    }
    setSelectedWatchlistIds(newSelected);
  };

  const handleConfirmAddToWatchlist = () => {
    selectedWatchlistIds.forEach(watchlistId => {
      onAddToWatchlist(watchlistId, market);
    });
    setShowWatchlistDropdown(false);
    setSelectedWatchlistIds(new Set());
    console.log('⭐ Added to watchlists:', selectedWatchlistIds);
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
  
  const relatedItems = [
    {
      id: 'rel-1',
      title: 'Will Ethereum hit $8,000 in 2026?',
      category: 'Crypto',
      image:
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop',
    },
    {
      id: 'rel-2',
      title: 'Lakers to win NBA Championship 2026?',
      category: 'Sports',
      image:
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
    },
    {
      id: 'rel-3',
      title: 'GTA 6 to release in 2026?',
      category: 'Pop Culture',
      image:
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop',
    },
    {
      id: 'rel-4',
      title: 'Apple to reach $5 trillion valuation?',
      category: 'Finance',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
    },
  ];

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
                className={`marketModal__watchlist-btn ${selectedWatchlistIds.size > 0 ? 'active' : ''}`}
                onClick={() => setShowWatchlistDropdown(!showWatchlistDropdown)}
              >
                {selectedWatchlistIds.size > 0 ? `✓ ${selectedWatchlistIds.size} Selected` : '+ Watchlist'}
              </button>

              {showWatchlistDropdown && (
                <div className="marketModal__watchlist-dropdown">
                  {watchlists.length === 0 ? (
                    <div className="marketModal__watchlist-empty">
                      <p>No watchlists yet. Create one first!</p>
                    </div>
                  ) : (
                    <>
                      <div className="marketModal__watchlist-list">
                        {watchlists.map((watchlist) => (
                          <label key={watchlist.id} className="marketModal__watchlist-item">
                            <input
                              type="checkbox"
                              checked={selectedWatchlistIds.has(watchlist.id)}
                              onChange={() => handleToggleWatchlist(watchlist.id)}
                            />
                            <span>{watchlist.name}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        className="marketModal__watchlist-confirm"
                        onClick={handleConfirmAddToWatchlist}
                        disabled={selectedWatchlistIds.size === 0}
                      >
                        Add to Selected
                      </button>
                    </>
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
            disabled={isTrading}
          >
            {isTrading ? 'Placing Order...' : 'Trade Now'}
          </button>

          <div className="marketModal__related">
            <h3 className="marketModal__related-title">More Like This</h3>
            <div className="marketModal__related-grid">
              {relatedItems.map((item) => (
                <div key={item.id} className="marketModal__related-card">
                  <div
                    className="marketModal__related-image"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="marketModal__related-info">
                    <span className="marketModal__related-name">{item.title}</span>
                    <span className="marketModal__related-category">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketModal;