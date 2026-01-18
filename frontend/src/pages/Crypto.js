import React, { useEffect, useMemo, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './Crypto.css';

const GROUP_CONFIG = [
  { key: 'bitcoin', label: 'Bitcoin', match: ['bitcoin', 'btc'] },
  { key: 'ethereum', label: 'Ethereum', match: ['ethereum', 'eth'] },
  { key: 'solana', label: 'Solana', match: ['solana', 'sol'] },
  { key: 'memes', label: 'Meme Coins', match: ['doge', 'dogecoin', 'shib'] },
  {
    key: 'etf',
    label: 'ETFs & Institutions',
    match: ['etf', 'blackrock', 'fidelity', 'spot'],
  },
  {
    key: 'regulation',
    label: 'Regulation & Policy',
    match: ['sec', 'regulation', 'lawsuit', 'court', 'ban'],
  },
  {
    key: 'macro',
    label: 'Macro & Markets',
    match: ['fed', 'rates', 'inflation', 'recession', 'market cap'],
  },
];

const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getMarketKeywords = (market) => {
  const title =
    market?.title ||
    market?.question ||
    market?.name ||
    market?.slug ||
    '';
  const category = market?.category || '';
  const eventTitle = market?.event?.title || market?.event?.slug || '';
  const tagValues = Array.isArray(market?.tags)
    ? market.tags
        .map((tag) => {
          if (typeof tag === 'string') return tag;
          return tag?.label || tag?.name || tag?.slug || '';
        })
        .filter(Boolean)
    : [];
  const relatedTagValues = Array.isArray(market?.related_tags)
    ? market.related_tags
        .map((tag) => tag?.label || tag?.slug || '')
        .filter(Boolean)
    : [];

  return normalizeText(
    [
      title,
      category,
      eventTitle,
      tagValues.join(' '),
      relatedTagValues.join(' '),
    ].join(' ')
  );
};

const groupMarkets = (markets) => {
  const grouped = Object.fromEntries(
    GROUP_CONFIG.map((group) => [group.key, []])
  );
  const other = [];

  markets.forEach((market) => {
    const haystack = getMarketKeywords(market);
    const matchedGroup = GROUP_CONFIG.find((group) =>
      group.match.some((keyword) => haystack.includes(normalizeText(keyword)))
    );
    if (matchedGroup) {
      grouped[matchedGroup.key].push(market);
    } else {
      other.push(market);
    }
  });

  return { grouped, other };
};

function Crypto() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [cryptoMarkets, setCryptoMarkets] = useState(marketData.crypto);
  const { grouped, other } = useMemo(
    () => groupMarkets(cryptoMarkets),
    [cryptoMarkets]
  );

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const response = await fetch(
          'http://localhost:5002/api/polymarket/crypto?limit=20'
        );
        const data = await response.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          setCryptoMarkets(data.markets);
        }
      } catch (error) {
        console.error('❌ Error fetching crypto markets:', error);
      }
    };

    fetchCrypto();
  }, []);

  return (
    <div className="crypto">
      <div className="crypto__header">
        <h2>Crypto</h2>
      </div>
      <div className="crypto__rows">
        {GROUP_CONFIG.map((group) =>
          grouped[group.key]?.length ? (
            <MarketRow
              key={group.key}
              title={group.label}
              markets={grouped[group.key]}
              onSelectMarket={setSelectedMarket}
            />
          ) : null
        )}
        {other.length > 0 && (
          <MarketRow
            title="More Crypto"
            markets={other}
            onSelectMarket={setSelectedMarket}
          />
        )}
      </div>
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default Crypto;

