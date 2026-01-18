import React, { useEffect, useMemo, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './Culture.css';

const GROUP_CONFIG = [
  {
    key: 'movies',
    label: 'Movies',
    match: ['movie', 'film', 'cinema', 'box office', 'theater'],
  },
  {
    key: 'tv',
    label: 'TV & Streaming',
    match: ['tv', 'series', 'show', 'season', 'episode', 'netflix', 'hbo', 'prime'],
  },
  {
    key: 'music',
    label: 'Music',
    match: ['music', 'album', 'song', 'tour', 'concert', 'festival', 'artist'],
  },
  {
    key: 'awards',
    label: 'Awards',
    match: ['oscar', 'oscars', 'grammy', 'emmy', 'award', 'golden globe'],
  },
  {
    key: 'celebs',
    label: 'Celebrities',
    match: ['celebrity', 'actor', 'actress', 'influencer', 'creator', 'rapper'],
  },
  {
    key: 'gaming',
    label: 'Gaming',
    match: ['game', 'gaming', 'gta', 'console', 'playstation', 'xbox', 'switch'],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    match: ['entertainment', 'pop culture', 'popculture', 'trending'],
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
  const description = market?.description || '';
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
      description,
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

function Culture() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [cultureMarkets, setCultureMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { grouped, other } = useMemo(
    () => groupMarkets(cultureMarkets),
    [cultureMarkets]
  );

  useEffect(() => {
    const fetchCulture = async () => {
      try {
        const response = await fetch(
          'http://localhost:5002/api/polymarket/popculture?limit=200&strategy=balanced'
        );
        const data = await response.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          setCultureMarkets(data.markets);
        } else {
          setCultureMarkets(marketData.popCulture || []);
        }
      } catch (error) {
        console.error('❌ Error fetching culture markets:', error);
        setCultureMarkets(marketData.popCulture || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCulture();
  }, []);

  if (isLoading) {
    return (
      <div className="culture">
        <div className="culture__header">
          <h2>Culture</h2>
        </div>
        <div className="culture__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="culture">
      <div className="culture__header">
        <h2>Culture</h2>
      </div>
      <div className="culture__rows">
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
            title="More Culture"
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

export default Culture;

