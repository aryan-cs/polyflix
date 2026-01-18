import React, { useState, useEffect } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import './MyWatchlists.css';

export const WATCHLISTS_STORAGE_KEY = 'polyflix_watchlists';

// Helper functions to manage watchlists from anywhere in the app
export const getWatchlists = () => {
  const stored = localStorage.getItem(WATCHLISTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveWatchlists = (watchlists) => {
  localStorage.setItem(WATCHLISTS_STORAGE_KEY, JSON.stringify(watchlists));
};

export const addMarketToWatchlist = (watchlistId, market) => {
  const watchlists = getWatchlists();
  const updated = watchlists.map(w =>
    w.id === watchlistId
      ? {
          ...w,
          markets: w.markets.some(m => m.id === market.id)
            ? w.markets
            : [...w.markets, market]
        }
      : w
  );
  saveWatchlists(updated);
  return updated;
};

export const removeMarketFromWatchlist = (watchlistId, marketId) => {
  const watchlists = getWatchlists();
  const updated = watchlists.map(w =>
    w.id === watchlistId
      ? { ...w, markets: w.markets.filter(m => m.id !== marketId) }
      : w
  );
  saveWatchlists(updated);
  return updated;
};

export const isMarketInWatchlist = (watchlistId, marketId) => {
  const watchlists = getWatchlists();
  const watchlist = watchlists.find(w => w.id === watchlistId);
  return watchlist ? watchlist.markets.some(m => m.id === marketId) : false;
};

export const getWatchlistsContainingMarket = (marketId) => {
  const watchlists = getWatchlists();
  return watchlists.filter(w => w.markets.some(m => m.id === marketId)).map(w => w.id);
};

function MyWatchlists() {
  const [watchlists, setWatchlists] = useState(() => getWatchlists());
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState(null);
  const [editName, setEditName] = useState('');

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    saveWatchlists(watchlists);
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

  const handleToggleWatchlist = (watchlistId, market, isAdding) => {
    if (isAdding) {
      handleAddToWatchlist(watchlistId, market);
    } else {
      handleRemoveMarketFromWatchlist(watchlistId, market.id);
    }
  };

  return (
    <div className="myWatchlists">
      <div className="myWatchlists__header">
        <h2>My Watchlists</h2>
        <button
          className="myWatchlists__createBtn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Watchlist
        </button>
      </div>

      {showCreateModal && (
        <div className="myWatchlists__modalOverlay" onClick={() => setShowCreateModal(false)}>
          <div className="myWatchlists__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Watchlist</h3>
            <input
              type="text"
              className="myWatchlists__input"
              placeholder="Enter watchlist name..."
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateWatchlist()}
              autoFocus
            />
            <div className="myWatchlists__modalButtons">
              <button
                className="myWatchlists__modalBtn myWatchlists__modalBtn--cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWatchlistName('');
                }}
              >
                Cancel
              </button>
              <button
                className="myWatchlists__modalBtn myWatchlists__modalBtn--create"
                onClick={handleCreateWatchlist}
                disabled={!newWatchlistName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="myWatchlists__container">
        {watchlists.length === 0 ? (
          <div className="myWatchlists__empty">
            <p>You haven't created any watchlists yet.</p>
            <p>Create one to start tracking your favorite markets!</p>
          </div>
        ) : (
          watchlists.map(watchlist => (
            <div key={watchlist.id} className="myWatchlists__rowContainer">
              <div className="myWatchlists__rowHeader">
                {editingWatchlist === watchlist.id ? (
                  <div className="myWatchlists__editContainer">
                    <input
                      type="text"
                      className="myWatchlists__editInput"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditWatchlist(watchlist.id, editName)}
                      autoFocus
                    />
                    <button
                      className="myWatchlists__iconBtn myWatchlists__saveBtn"
                      onClick={() => handleEditWatchlist(watchlist.id, editName)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__cancelBtn"
                      onClick={() => {
                        setEditingWatchlist(null);
                        setEditName('');
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="myWatchlists__titleContainer">
                    <h3 className="myWatchlists__rowTitle">{watchlist.name}</h3>
                    <span className="myWatchlists__marketCount">
                      {watchlist.markets.length} {watchlist.markets.length === 1 ? 'market' : 'markets'}
                    </span>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__editBtn"
                      onClick={() => {
                        setEditingWatchlist(watchlist.id);
                        setEditName(watchlist.name);
                      }}
                      title="Edit watchlist name"
                    >
                      ✏️
                    </button>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__deleteBtn"
                      onClick={() => handleDeleteWatchlist(watchlist.id)}
                      title="Delete watchlist"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {watchlist.markets.length === 0 ? (
                <div className="myWatchlists__emptyRow">
                  <p>No markets in this watchlist yet. Browse markets and add them here!</p>
                </div>
              ) : (
                <MarketRow
                  title=""
                  markets={watchlist.markets}
                  onSelectMarket={setSelectedMarket}
                  showRemoveButton={true}
                  onRemoveMarket={(marketId) => handleRemoveMarketFromWatchlist(watchlist.id, marketId)}
                />
              )}
            </div>
          ))
        )}
      </div>

      {selectedMarket && (
        <MarketModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          watchlists={watchlists}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}
    </div>
  );
}

export default MyWatchlists;
