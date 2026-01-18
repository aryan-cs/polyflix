import React, { useEffect, useMemo, useState } from 'react';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';
import './Sports.css';

const GROUP_CONFIG = [
  { key: 'nfl', label: 'NFL', match: ['nfl', 'super bowl', 'gridiron'] },
  { key: 'nba', label: 'NBA', match: ['nba', 'wnba', 'basketball'] },
  { key: 'mlb', label: 'MLB', match: ['mlb', 'baseball', 'world series'] },
  { key: 'soccer', label: 'Soccer', match: ['soccer', 'football', 'fifa'] },
  { key: 'nhl', label: 'NHL', match: ['nhl', 'hockey', 'stanley cup'] },
  { key: 'tennis', label: 'Tennis', match: ['tennis', 'wimbledon', 'us open'] },
  { key: 'golf', label: 'Golf', match: ['golf', 'pga', 'masters'] },
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
    [title, category, eventTitle, tagValues.join(' '), relatedTagValues.join(' ')].join(
      ' '
    )
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

function Sports() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [sportsMarkets, setSportsMarkets] = useState(marketData.sports);
  const { grouped, other } = useMemo(
    () => groupMarkets(sportsMarkets),
    [sportsMarkets]
  );

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch(
          'http://localhost:5002/api/polymarket/sports?limit=20'
        );
        const data = await response.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          setSportsMarkets(data.markets);
        }
      } catch (error) {
        console.error('❌ Error fetching sports markets:', error);
      }
    };

    fetchSports();
  }, []);

  return (
    <div className="sports">
      <div className="sports__header">
        <h2>Sports</h2>
      </div>
      <div className="sports__rows">
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
            title="More Sports"
            markets={other}
            onSelectMarket={setSelectedMarket}
          />
        )}
      </div>
      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </div>
  );
}

export default Sports;

