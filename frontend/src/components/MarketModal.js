import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MarketModal.css';

function MarketModal({ market, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const bodyRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing((prev) => {
      if (prev) return prev;
      closeTimerRef.current = window.setTimeout(() => {
        onCloseRef.current();
      }, 250);
      return true;
    });
  }, []);

  useEffect(() => {
    setIsClosing(false);
    setIsExpanded(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [market]);

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

  const description =
    market.description || 'No description available yet for this market.';
  const shouldTruncate = description.length > 220;
  const visibleDescription =
    !shouldTruncate || isExpanded
      ? description
      : `${description.slice(0, 200).trim()}...`;
  const outcomePairs = Array.isArray(market.outcomePairs)
    ? market.outcomePairs
    : [];
  const showOutcomeList = outcomePairs.length > 0 && !market.hasBinaryOutcomes;
  const yesPrice =
    market.yesPrice === 0 || market.yesPrice
      ? `${market.yesPrice}¢`
      : '—';
  const noPrice =
    market.noPrice === 0 || market.noPrice ? `${market.noPrice}¢` : '—';
  const volume = market.volume ? `$${market.volume}` : '—';
  const liquidity = market.liquidity ? `$${market.liquidity}` : '—';
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
          <h2 className="marketModal__title">{market.title}</h2>

          <div className="marketModal__meta">
            <span className="marketModal__badge">{market.category || 'Market'}</span>
            <span className="marketModal__end">
              Ends {market.endDate || 'TBD'}
            </span>
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
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Liquidity</span>
                  <span className="marketModal__stat-value">{liquidity}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="marketModal__stats">
              <div className="marketModal__stat">
                <span className="marketModal__stat-label">Yes</span>
                <span className="marketModal__stat-value marketModal__stat-value--yes">
                  {yesPrice}
                </span>
              </div>
              <div className="marketModal__stat">
                <span className="marketModal__stat-label">No</span>
                <span className="marketModal__stat-value marketModal__stat-value--no">
                  {noPrice}
                </span>
              </div>
              <div className="marketModal__stat">
                <span className="marketModal__stat-label">Volume</span>
                <span className="marketModal__stat-value">{volume}</span>
              </div>
              <div className="marketModal__stat">
                <span className="marketModal__stat-label">Liquidity</span>
                <span className="marketModal__stat-value">{liquidity}</span>
              </div>
            </div>
          )}

          <button className="marketModal__cta">Trade Now</button>

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

