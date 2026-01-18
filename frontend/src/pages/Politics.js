import React, { useEffect, useMemo, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './Politics.css';

const GROUP_CONFIG = [
  { key: 'trump', label: 'Trump Markets', match: ['trump', 'donald'] },
  { key: 'elon', label: 'Elon Markets', match: ['elon', 'musk'] },
  { key: 'biden', label: 'Biden / Harris', match: ['biden', 'harris'] },
  {
    key: 'elections',
    label: 'Elections',
    match: ['election', 'vote', 'campaign', 'primary'],
  },
  {
    key: 'government',
    label: 'Government & Congress',
    match: ['congress', 'senate', 'house', 'governor', 'mayor'],
  },
  {
    key: 'uk',
    label: 'UK Politics',
    match: ['uk', 'britain', 'parliament', 'brexit', 'prime minister'],
  },
  {
    key: 'geopolitics',
    label: 'Geopolitics',
    match: ['war', 'conflict', 'ukraine', 'russia', 'israel', 'gaza'],
  },
];

const getMarketKeywords = (market) => {
  const title =
    market?.title ||
    market?.question ||
    market?.name ||
    market?.slug ||
    '';
  const description = market?.description || '';
  const category = market?.category || '';
  const eventTitle = market?.event?.title || market?.event?.slug || '';
  const outcomeValues = Array.isArray(market?.outcomes)
    ? market.outcomes
    : [];
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

  return [
    title,
    description,
    category,
    eventTitle,
    tagValues.join(' '),
    relatedTagValues.join(' '),
    outcomeValues.join(' '),
  ]
    .join(' ')
    .toLowerCase()
    .trim();
};

const groupMarkets = (markets) => {
  const grouped = Object.fromEntries(
    GROUP_CONFIG.map((group) => [group.key, []])
  );
  const other = [];

  markets.forEach((market) => {
    const haystack = getMarketKeywords(market);
    const matchedGroup = GROUP_CONFIG.find((group) =>
      group.match.some((keyword) => haystack.includes(keyword))
    );
    if (matchedGroup) {
      grouped[matchedGroup.key].push(market);
    } else {
      other.push(market);
    }
  });

  return { grouped, other };
};

function Politics() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [politicsMarkets, setPoliticsMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { grouped, other } = useMemo(
    () => groupMarkets(politicsMarkets),
    [politicsMarkets]
  );

  useEffect(() => {
    const fetchPolitics = async () => {
      try {
        const response = await fetch(
          'http://localhost:5002/api/polymarket/politics?limit=80&strategy=balanced'
        );
        const data = await response.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          setPoliticsMarkets(data.markets);
        } else {
          // Fallback to mock data if API returns empty
          setPoliticsMarkets(marketData.politics);
        }
      } catch (error) {
        console.error('❌ Error fetching politics markets:', error);
        // Fallback to mock data on error
        setPoliticsMarkets(marketData.politics);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolitics();
  }, []);

  if (isLoading) {
    return (
      <div className="politics">
        <div className="politics__header">
          <h2>Politics</h2>
        </div>
        <div className="politics__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="politics">
      <div className="politics__header">
        <h2>Politics</h2>
      </div>
      <div className="politics__rows">
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
            title="More Politics"
            markets={other}
            onSelectMarket={setSelectedMarket}
          />
        )}
      </div>
      <MarketModal
        market={selectedMarket}
        onClose={() => setSelectedMarket(null)}
        onSelectMarket={setSelectedMarket}
      />
    </div>
  );
}

export default Politics;

