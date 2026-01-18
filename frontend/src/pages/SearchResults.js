import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MarketRow from '../components/MarketRow';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const fetchAllMarkets = async () => {
  // Fetch all categories and flatten
  const endpoints = [
    'sports', 'trending', 'politics', 'crypto', 'popculture', 'finance', 'tech', 'climate', 'earnings'
  ];
  const results = await Promise.all(
    endpoints.map(cat =>
      fetch(`http://localhost:5002/api/polymarket/${cat}?limit=50`).then(res => res.json())
    )
  );
  // Flatten all markets
  return results.flatMap(r => r.markets || []);
};

export default function SearchResults() {
  const query = useQuery();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchTerm = query.get('q') || '';

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAllMarkets()
      .then(allMarkets => {
        const filtered = allMarkets.filter(m => {
          const title = (m.title || m.question || '').toLowerCase();
          return title.includes(searchTerm.toLowerCase());
        });
        setSearchResults(filtered);
        setLoading(false);
      })
      .catch(e => {
        setError('Failed to fetch markets');
        setLoading(false);
      });
  }, [searchTerm]);

  return (
    <div
      className="search-results-page"
      style={{
        color: 'white',
        padding: '15vh 0 10vh 5vh',
        minHeight: '100vh',
        maxWidth: '100vw',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <h2 style={{ margin: '0 0 32px 24px', fontWeight: 700, fontSize: 32, letterSpacing: '-1px' }}>
        Search Results for "{searchTerm}"
      </h2>
      <div style={{ width: '100%', padding: '0 0' }}>
        {loading && <div style={{ marginBottom: 24 }}>Loading...</div>}
        {error && <div style={{ color: 'red', marginBottom: 24 }}>{error}</div>}
        {!loading && searchResults.length === 0 && <div style={{ marginBottom: 24 }}>No results found.</div>}
        {!loading && searchResults.length > 0 && (
          <MarketRow title="Results" markets={searchResults} onSelectMarket={() => {}} />
        )}
      </div>
    </div>
  );
}
