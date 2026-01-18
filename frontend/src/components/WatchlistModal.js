import React, { useState, useCallback, useEffect, useRef } from 'react';
import './WatchlistModal.css';
import PriceHistoryGraph from './PriceHistoryGraph';

function WatchlistModal({
  watchlist,
  onClose,
  onSelectMarket,
  onRemoveMarket,
  onEditName,
  onDelete,
  onAddMarket,
  blacklist,
  onAddToBlacklist
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(watchlist?.name || '');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [graphMarkets, setGraphMarkets] = useState([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  // Track the watchlist ID to detect when we switch to a different watchlist
  const watchlistIdRef = useRef(watchlist?.id);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Only reset recommendations if we're switching to a different watchlist
    const isNewWatchlist = watchlist?.id !== watchlistIdRef.current;
    if (isNewWatchlist) {
      setRecommendations([]);
      setGraphMarkets([]);
      watchlistIdRef.current = watchlist?.id;
    }
    
    setEditName(watchlist?.name || '');
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [watchlist]);

  // Fetch price history for top markets
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!watchlist || !watchlist.markets || watchlist.markets.length === 0) {
        setGraphMarkets([]);
        return;
      }

      setIsLoadingGraph(true);
      console.log('📊 [GRAPH] Starting to fetch price history for watchlist:', watchlist.name);

      try {
        // Sort markets by volume and take top 3 (reduced for performance)
        const sortedMarkets = [...watchlist.markets]
          .filter(m => m && m.id)
          .sort((a, b) => {
            const volA = a.volumeNum || parseFloat(a.volume) || 0;
            const volB = b.volumeNum || parseFloat(b.volume) || 0;
            return volB - volA;
          })
          .slice(0, 3);

        console.log('📊 [GRAPH] Top markets by volume:', sortedMarkets.map(m => ({ id: m.id, title: m.title || m.question, volume: m.volumeNum || m.volume })));

        if (sortedMarkets.length === 0) {
          console.log('📊 [GRAPH] No markets with IDs found');
          setGraphMarkets([]);
          setIsLoadingGraph(false);
          return;
        }

        // Fetch market details and price history for each market
        const marketsWithHistory = await Promise.all(
          sortedMarkets.map(async (market) => {
            try {
              console.log(`📊 [GRAPH] Fetching details for market ${market.id}: ${market.title || market.question}`);
              
              // Fetch full market details to get token IDs
              const marketDetailsResponse = await fetch(
                `http://localhost:5002/api/polymarket/market/${market.id}`
              );

              if (!marketDetailsResponse.ok) {
                const errorText = await marketDetailsResponse.text();
                console.error(`❌ [GRAPH] Failed to fetch market details for ${market.id}:`, marketDetailsResponse.status, errorText);
                return null;
              }

              const marketDetails = await marketDetailsResponse.json();
              console.log(`✅ [GRAPH] Got market details for ${market.id}:`, {
                hasOutcomes: !!marketDetails.outcomes,
                hasClobTokenIds: !!marketDetails.clobTokenIds,
                outcomes: marketDetails.outcomes,
                outcomesType: typeof marketDetails.outcomes,
                clobTokenIds: marketDetails.clobTokenIds,
                clobTokenIdsType: typeof marketDetails.clobTokenIds
              });

              // Parse outcomes - handle both array and JSON string formats
              let outcomes = marketDetails.outcomes;
              if (typeof outcomes === 'string') {
                try {
                  outcomes = JSON.parse(outcomes);
                } catch (e) {
                  console.error(`❌ [GRAPH] Failed to parse outcomes string for market ${market.id}:`, e);
                  outcomes = [];
                }
              }
              if (!Array.isArray(outcomes)) {
                console.error(`❌ [GRAPH] Outcomes is not an array for market ${market.id}:`, outcomes);
                outcomes = [];
              }

              // Parse clobTokenIds - handle both array and JSON string formats
              let clobTokenIds = marketDetails.clobTokenIds;
              if (typeof clobTokenIds === 'string') {
                try {
                  clobTokenIds = JSON.parse(clobTokenIds);
                } catch (e) {
                  console.error(`❌ [GRAPH] Failed to parse clobTokenIds string for market ${market.id}:`, e);
                  clobTokenIds = [];
                }
              }
              if (!Array.isArray(clobTokenIds)) {
                console.error(`❌ [GRAPH] clobTokenIds is not an array for market ${market.id}:`, clobTokenIds);
                clobTokenIds = [];
              }

              // Find "Yes" token ID
              const yesIndex = outcomes.findIndex(
                outcome => outcome && typeof outcome === 'string' && outcome.toLowerCase() === 'yes'
              );

              if (yesIndex === -1 || !clobTokenIds[yesIndex]) {
                console.error(`❌ [GRAPH] No "Yes" token found for market ${market.id}. Outcomes:`, outcomes, 'Token IDs:', clobTokenIds);
                return null;
              }

              const yesTokenId = clobTokenIds[yesIndex];
              console.log(`📊 [GRAPH] Found Yes token ID for ${market.id}: ${yesTokenId}`);

              // Fetch price history
              const priceHistoryResponse = await fetch(
                `http://localhost:5002/api/polymarket/prices-history/${yesTokenId}`
              );

              if (!priceHistoryResponse.ok) {
                const errorText = await priceHistoryResponse.text();
                console.error(`❌ [GRAPH] Failed to fetch price history for token ${yesTokenId}:`, priceHistoryResponse.status, errorText);
                return null;
              }

              const priceHistory = await priceHistoryResponse.json();
              console.log(`✅ [GRAPH] Got price history for ${market.id}:`, {
                count: priceHistory?.length || 0,
                isArray: Array.isArray(priceHistory),
                sample: priceHistory?.slice(0, 3) || 'none'
              });

              return {
                ...market,
                priceHistory: priceHistory || []
              };
            } catch (error) {
              console.error(`❌ [GRAPH] Error fetching data for market ${market.id}:`, error);
              return null;
            }
          })
        );

        // Filter out null results
        const validMarkets = marketsWithHistory.filter(m => m !== null);
        console.log(`📊 [GRAPH] Successfully fetched data for ${validMarkets.length}/${sortedMarkets.length} markets`);
        setGraphMarkets(validMarkets);
      } catch (error) {
        console.error('❌ [GRAPH] Error fetching price history:', error);
        setGraphMarkets([]);
      } finally {
        setIsLoadingGraph(false);
      }
    };

    fetchPriceHistory();
  }, [watchlist]);

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
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== watchlist.name) {
      onEditName(watchlist.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(watchlist.id);
    handleClose();
  };

  const fetchRecommendations = async () => {
    if (!watchlist || !watchlist.markets || watchlist.markets.length < 3) {
      alert('Watchlist needs at least 3 markets to get recommendations.');
      return;
    }

    setIsLoadingRecs(true);
    try {
      // Prepare watchlist data with validation
      const watchlistData = watchlist.markets
        .filter(m => m && (m.id || m.title || m.question)) // Filter out invalid markets
        .map(m => {
          const volume = m.volume;
          let volumeNum = 0;
          if (volume !== null && volume !== undefined) {
            if (typeof volume === 'string') {
              volumeNum = parseFloat(volume) || 0;
            } else if (typeof volume === 'number') {
              volumeNum = isNaN(volume) ? 0 : volume;
            }
          }
          
          return {
            id: String(m.id || ''),
            title: String(m.title || m.question || 'Untitled Market'),
            volume: Math.max(0, Math.floor(volumeNum)) // Ensure non-negative integer
          };
        });

      // Prepare blacklist data with validation
      const blacklistData = (blacklist || [])
        .filter(m => m && (m.id || m.title || m.question))
        .map(m => {
          const volume = m.volume;
          let volumeNum = 0;
          if (volume !== null && volume !== undefined) {
            if (typeof volume === 'string') {
              volumeNum = parseFloat(volume) || 0;
            } else if (typeof volume === 'number') {
              volumeNum = isNaN(volume) ? 0 : volume;
            }
          }
          
          return {
            id: String(m.id || ''),
            title: String(m.title || m.question || 'Untitled Market'),
            volume: Math.max(0, Math.floor(volumeNum))
          };
        });

      if (watchlistData.length < 3) {
        alert('Watchlist needs at least 3 valid markets to get recommendations.');
        setIsLoadingRecs(false);
        return;
      }

      const requestBody = {
        watchlist: watchlistData,
        disliked_items: blacklistData
      };

      console.log('Sending recommendation request:', {
        watchlistCount: watchlistData.length,
        blacklistCount: blacklistData.length,
        sampleMarket: watchlistData[0]
      });

      const response = await fetch('http://localhost:8000/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}. ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations.slice(0, 5));
      } else {
        console.error('Unexpected response format:', data);
        alert('Failed to get recommendations. Please check the console for details.');
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      alert(`Failed to fetch recommendations: ${error.message}. Make sure the Python backend is running on port 8000.`);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleLikeRecommendation = (market) => {
    if (onAddMarket) {
      onAddMarket(watchlist.id, market);
    }
    setRecommendations(prev => prev.filter(r => r.id !== market.id));
  };

  const handleDislikeRecommendation = (market) => {
    if (onAddToBlacklist) {
      onAddToBlacklist(market);
    }
    setRecommendations(prev => prev.filter(r => r.id !== market.id));
  };

  if (!watchlist) return null;

  return (
    <div
      className={`watchlistModal ${isClosing ? 'watchlistModal--closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className="watchlistModal__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="watchlistModal__close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="watchlistModal__header">
          {isEditing ? (
            <div className="watchlistModal__editContainer">
              <input
                type="text"
                className="watchlistModal__editInput"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                autoFocus
              />
              <button
                className="watchlistModal__iconBtn watchlistModal__saveBtn"
                onClick={handleSaveEdit}
              >
                ✓
              </button>
              <button
                className="watchlistModal__iconBtn watchlistModal__cancelBtn"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(watchlist.name);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="watchlistModal__titleRow">
              <h2 className="watchlistModal__title">{watchlist.name}</h2>
              <span className="watchlistModal__count">
                {watchlist.markets.length} {watchlist.markets.length === 1 ? 'market' : 'markets'}
              </span>
              <div className="watchlistModal__actions">
                <button
                  className="watchlistModal__iconBtn"
                  onClick={() => setIsEditing(true)}
                  title="Edit name"
                >
                  ✏️
                </button>
                <button
                  className="watchlistModal__iconBtn watchlistModal__deleteBtn"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete watchlist"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}

          {watchlist.markets.length >= 3 && recommendations.length === 0 && !isLoadingRecs && (
            <button
              className="watchlistModal__recsBtn"
              onClick={fetchRecommendations}
            >
              Find Recommendations
            </button>
          )}
          {isLoadingRecs && (
            <span className="watchlistModal__loading">Loading recommendations...</span>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="watchlistModal__deleteConfirm">
            <p>Are you sure you want to delete "{watchlist.name}"?</p>
            <div className="watchlistModal__deleteButtons">
              <button
                className="watchlistModal__deleteConfirmBtn"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                className="watchlistModal__deleteCancelBtn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="watchlistModal__body">
          {watchlist.markets.length === 0 ? (
            <div className="watchlistModal__empty">
              <p>No markets in this watchlist yet.</p>
              <p>Browse markets and add them here!</p>
            </div>
          ) : (
            <>
              {watchlist.markets.length > 0 && (
                <div className="watchlistModal__graphSection">
                  <PriceHistoryGraph markets={graphMarkets} loading={isLoadingGraph} />
                </div>
              )}
              <div className="watchlistModal__marketsSection">
                <div className="watchlistModal__marketList">
                  {watchlist.markets.map((market) => (
                    <div
                      key={market.id}
                      className="watchlistModal__marketItem"
                      onClick={() => onSelectMarket(market)}
                    >
                      <img
                        className="watchlistModal__marketImage"
                        src={market.image}
                        alt={market.title}
                      />
                      <div className="watchlistModal__marketInfo">
                        <span className="watchlistModal__marketTitle">{market.title || market.question || 'Untitled Market'}</span>
                      </div>
                      <button
                        className="watchlistModal__removeBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMarket(watchlist.id, market.id);
                        }}
                        title="Remove from watchlist"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {recommendations.length > 0 && (
            <div className="watchlistModal__recommendations">
              <h3 className="watchlistModal__recsTitle">Recommended For You</h3>
              <div className="watchlistModal__recsList">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="watchlistModal__recCard">
                    <div className="watchlistModal__recInfo">
                      <span className="watchlistModal__recTitle">{rec.title}</span>
                      <span className="watchlistModal__recScore">
                        Score: {(rec.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="watchlistModal__recActions">
                      <button
                        className="watchlistModal__recBtn watchlistModal__recBtn--like"
                        onClick={() => handleLikeRecommendation(rec)}
                        title="Add to watchlist"
                      >
                        Like
                      </button>
                      <button
                        className="watchlistModal__recBtn watchlistModal__recBtn--dislike"
                        onClick={() => handleDislikeRecommendation(rec)}
                        title="Not interested"
                      >
                        Dislike
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchlistModal;
