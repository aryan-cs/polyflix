import React, { useState, useEffect } from 'react';
import WatchlistCard from '../components/WatchlistCard';
import WatchlistModal from '../components/WatchlistModal';
import MarketModal from '../components/MarketModal';
import './MyWatchlists.css';

export const WATCHLISTS_STORAGE_KEY = 'polyflix_watchlists';
export const BLACKLIST_STORAGE_KEY = 'polyflix_blacklist';

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

// Blacklist helper functions
export const getBlacklist = () => {
  const stored = localStorage.getItem(BLACKLIST_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveBlacklist = (blacklist) => {
  localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(blacklist));
};

export const addToBlacklist = (market) => {
  const blacklist = getBlacklist();
  if (!blacklist.some(m => m.id === market.id)) {
    const updated = [...blacklist, { id: market.id, title: market.title, volume: market.volume || 0 }];
    saveBlacklist(updated);
    return updated;
  }
  return blacklist;
};

function MyWatchlists() {
  const [watchlists, setWatchlists] = useState(() => getWatchlists());
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [blacklist, setBlacklist] = useState(() => getBlacklist());

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

  // Handle adding to blacklist
  const handleAddToBlacklist = (market) => {
    const newBlacklist = [...blacklist, { id: market.id, title: market.title, volume: market.volume || 0 }];
    setBlacklist(newBlacklist);
    saveBlacklist(newBlacklist);
  };

  // Keep selectedWatchlist in sync with watchlists state
  const currentWatchlist = selectedWatchlist
    ? watchlists.find(w => w.id === selectedWatchlist.id)
    : null;

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

      <div className="myWatchlists__grid">
        {watchlists.length === 0 ? (
          <div className="myWatchlists__empty">
            <p>You haven't created any watchlists yet.</p>
            <p>Create one to start tracking your favorite markets!</p>
          </div>
        ) : (
          watchlists.map(watchlist => (
            <WatchlistCard
              key={watchlist.id}
              watchlist={watchlist}
              onClick={() => setSelectedWatchlist(watchlist)}
            />
          ))
        )}
      </div>

      {currentWatchlist && (
        <WatchlistModal
          watchlist={currentWatchlist}
          onClose={() => setSelectedWatchlist(null)}
          onSelectMarket={setSelectedMarket}
          onRemoveMarket={handleRemoveMarketFromWatchlist}
          onEditName={handleEditWatchlist}
          onDelete={handleDeleteWatchlist}
          onAddMarket={handleAddToWatchlist}
          blacklist={blacklist}
          onAddToBlacklist={handleAddToBlacklist}
        />
      )}

      {selectedMarket && (
        <MarketModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          watchlists={watchlists}
          onToggleWatchlist={handleToggleWatchlist}
          onSelectMarket={setSelectedMarket}
        />
      )}
    </div>
  );
}

export default MyWatchlists;
