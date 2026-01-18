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

  const handleDeleteWatchlist = (id) => {
    setWatchlists(watchlists.filter(w => w.id !== id));
  };

  const handleStartEdit = (watchlist) => {
    setEditingWatchlist(watchlist.id);
    setEditName(watchlist.name);
  };

  const handleSaveEdit = (id) => {
    if (editName.trim()) {
      setWatchlists(watchlists.map(w =>
        w.id === id ? { ...w, name: editName.trim() } : w
      ));
    }
    setEditingWatchlist(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingWatchlist(null);
    setEditName('');
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (showCreateModal) {
        setShowCreateModal(false);
        setNewWatchlistName('');
      } else if (editingWatchlist) {
        handleCancelEdit();
      }
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
          + Create New Watchlist
        </button>
      </div>

      {watchlists.length === 0 ? (
        <div className="myWatchlists__empty">
          <p>You don't have any watchlists yet.</p>
          <p>Click "Create New Watchlist" to get started!</p>
        </div>
      ) : (
        <div className="myWatchlists__rows">
          {watchlists.map((watchlist) => (
            <div key={watchlist.id} className="myWatchlists__rowContainer">
              <div className="myWatchlists__rowHeader">
                {editingWatchlist === watchlist.id ? (
                  <div className="myWatchlists__editContainer">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(watchlist.id))}
                      className="myWatchlists__editInput"
                      autoFocus
                    />
                    <button
                      className="myWatchlists__iconBtn myWatchlists__saveBtn"
                      onClick={() => handleSaveEdit(watchlist.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__cancelBtn"
                      onClick={handleCancelEdit}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="myWatchlists__titleContainer">
                    <h3 className="myWatchlists__rowTitle">{watchlist.name}</h3>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__editBtn"
                      onClick={() => handleStartEdit(watchlist)}
                      title="Edit name"
                    >
                      ✎
                    </button>
                    <button
                      className="myWatchlists__iconBtn myWatchlists__deleteBtn"
                      onClick={() => handleDeleteWatchlist(watchlist.id)}
                      title="Delete watchlist"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
              {watchlist.markets.length > 0 ? (
                <MarketRow title="" markets={watchlist.markets} onSelectMarket={setSelectedMarket} />
              ) : (
                <div className="myWatchlists__emptyRow">
                  <p>No markets in this watchlist yet. Add markets from the home page!</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="myWatchlists__modalOverlay" onClick={() => setShowCreateModal(false)}>
          <div className="myWatchlists__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Watchlist</h3>
            <input
              type="text"
              placeholder="Enter watchlist name..."
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCreateWatchlist)}
              className="myWatchlists__input"
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

      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default MyWatchlists;
