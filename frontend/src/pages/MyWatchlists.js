import React, { useState, useEffect } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import './MyWatchlists.css';

const WATCHLISTS_STORAGE_KEY = 'polyflix_watchlists';

function MyWatchlists() {
  const [watchlists, setWatchlists] = useState(() => {
    const stored = localStorage.getItem(WATCHLISTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState(null);
  const [editName, setEditName] = useState('');

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(WATCHLISTS_STORAGE_KEY, JSON.stringify(watchlists));
  }, [watchlists]);

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      const newWatchlist = {
        id: Date.now(),
        name: newWatchlistName.trim(),
        markets: []
      };
      setWatchlists([...watchlists, newWatchlist]);
      setNewWatchlistName('');
      setShowCreateModal(false);
    }
  };

  const handleDeleteWatchlist = (watchlistId) => {
    setWatchlists(watchlists.filter(w => w.id !== watchlistId));
  };

  const handleEditWatchlist = (watchlistId, newName) => {
    if (newName.trim()) {
      setWatchlists(watchlists.map(w =>
        w.id === watchlistId ? { ...w, name: newName.trim() } : w
      ));
      setEditingWatchlist(null);
      setEditName('');
    }
  };

  const handleRemoveMarketFromWatchlist = (watchlistId, marketId) => {
    setWatchlists(watchlists.map(w =>
      w.id === watchlistId
        ? { ...w, markets: w.markets.filter(m => m.id !== marketId) }
        : w
    ));
  };

  const handleAddToWatchlist = (watchlistId, market) => {
    setWatchlists(watchlists.map(w =>
      w.id === watchlistId
        ? { 
            ...w, 
            markets: w.markets.some(m => m.id === market.id) 
              ? w.markets 
              : [...w.markets, market]
          }
        : w
    ));
  };

  return (
    <div className="myWatchlists">
      <div className="myWatchlists__header">
        <h1>My Watchlists</h1>
        <button 
          className="myWatchlists__create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Watchlist
        </button>
      </div>

      {showCreateModal && (
        <div className="myWatchlists__modal">
          <div className="myWatchlists__modal-content">
            <h2>Create New Watchlist</h2>
            <input
              type="text"
              placeholder="Enter watchlist name"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateWatchlist()}
            />
            <div className="myWatchlists__modal-buttons">
              <button 
                className="myWatchlists__btn-primary"
                onClick={handleCreateWatchlist}
              >
                Create
              </button>
              <button 
                className="myWatchlists__btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWatchlistName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="myWatchlists__container">
        {watchlists.length === 0 ? (
          <div className="myWatchlists__empty">
            <p>No watchlists yet. Create one to get started!</p>
          </div>
        ) : (
          watchlists.map(watchlist => (
            <div key={watchlist.id} className="myWatchlists__watchlist">
              <div className="myWatchlists__watchlist-header">
                {editingWatchlist === watchlist.id ? (
                  <div className="myWatchlists__edit-group">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditWatchlist(watchlist.id, editName)}
                    />
                    <button
                      className="myWatchlists__btn-small"
                      onClick={() => handleEditWatchlist(watchlist.id, editName)}
                    >
                      Save
                    </button>
                    <button
                      className="myWatchlists__btn-small"
                      onClick={() => setEditingWatchlist(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2>{watchlist.name}</h2>
                    <div className="myWatchlists__watchlist-actions">
                      <button
                        className="myWatchlists__btn-icon"
                        onClick={() => {
                          setEditingWatchlist(watchlist.id);
                          setEditName(watchlist.name);
                        }}
                        title="Edit watchlist"
                      >
                        ✏️
                      </button>
                      <button
                        className="myWatchlists__btn-icon"
                        onClick={() => handleDeleteWatchlist(watchlist.id)}
                        title="Delete watchlist"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="myWatchlists__markets">
                {watchlist.markets.length === 0 ? (
                  <p className="myWatchlists__empty-message">
                    No markets in this watchlist yet
                  </p>
                ) : (
                  <div className="myWatchlists__market-list">
                    {watchlist.markets.map(market => (
                      <div 
                        key={market.id} 
                        className="myWatchlists__market-item"
                        onClick={() => setSelectedMarket(market)}
                      >
                        <MarketRow market={market} />
                        <button
                          className="myWatchlists__remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMarketFromWatchlist(watchlist.id, market.id);
                          }}
                          title="Remove from watchlist"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMarket && (
        <MarketModal 
          market={selectedMarket} 
          onClose={() => setSelectedMarket(null)}
          watchlists={watchlists}
          onAddToWatchlist={handleAddToWatchlist}
        />
      )}
    </div>
  );
}

export default MyWatchlists;