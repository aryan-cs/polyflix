import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import MarketRow from '../components/MarketRow';
import MarketModal from '../components/MarketModal';
import { marketData } from '../data/mockData';

const formatCompactNumber = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  const absValue = Math.abs(value);
  if (absValue >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (absValue >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (absValue >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `${Math.round(value)}`;
};

const normalizeMarket = (market) => {
  if (!market) return market;

  const parseMaybeJson = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  };

  const outcomes = parseMaybeJson(
    market.outcomes || market.outcomeNames || market.outcome_names
  );
  const outcomePrices = parseMaybeJson(
    market.outcomePrices || market.outcome_prices || market.prices
  );

  const parsePrice = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(num)) return undefined;
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
  };

  let yesPrice = market.yesPrice ?? market.yes_price;
  let noPrice = market.noPrice ?? market.no_price;
  let outcomePairs = [];
  let hasBinaryOutcomes = false;

  if ((yesPrice === undefined || noPrice === undefined) &&
      Array.isArray(outcomes) &&
      Array.isArray(outcomePrices)) {
    outcomePairs = outcomes
      .map((outcome, index) => {
        const price = parsePrice(outcomePrices[index]);
        if (!Number.isFinite(price)) return null;
        const label =
          typeof outcome === 'string'
            ? outcome
            : outcome?.title ||
              outcome?.name ||
              outcome?.label ||
              outcome?.outcome ||
              `Outcome ${index + 1}`;
        return { label, price };
      })
      .filter(Boolean)
      .sort((a, b) => b.price - a.price);

    const yesIndex = outcomes.findIndex(
      (outcome) => typeof outcome === 'string' && outcome.toLowerCase() === 'yes'
    );
    const noIndex = outcomes.findIndex(
      (outcome) => typeof outcome === 'string' && outcome.toLowerCase() === 'no'
    );
    hasBinaryOutcomes = yesIndex >= 0 && noIndex >= 0;

    if (yesPrice === undefined && yesIndex >= 0) {
      yesPrice = parsePrice(outcomePrices[yesIndex]);
    }
    if (noPrice === undefined && noIndex >= 0) {
      noPrice = parsePrice(outcomePrices[noIndex]);
    }
  }

  return {
    ...market,
    title: market.title || market.question || market.name,
    image: market.image || market.imageUrl || market.image_url || market.icon,
    category: market.category || market.group || market.tag || market.categoryName,
    endDate: market.endDate || market.end_date || market.endDateTime || market.resolveDate,
    yesPrice,
    noPrice,
    outcomePairs,
    hasBinaryOutcomes,
    volume: formatCompactNumber(market.volume ?? market.volumeNum ?? market.volume_num),
    liquidity: formatCompactNumber(
      market.liquidity ?? market.liquidityNum ?? market.liquidity_num
    ),
  };
};

function HomeScreen() {
  const [sportsMarkets, setSportsMarkets] = useState([]);
  const [trendingMarkets, setTrendingMarkets] = useState([]);
  const [politicsMarkets, setPoliticsMarkets] = useState([]);
  const [cryptoMarkets, setCryptoMarkets] = useState([]);
  const [popCultureMarkets, setPopCultureMarkets] = useState([]);
  const [financeMarkets, setFinanceMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/polymarket/sports?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setSportsMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));

    fetch('http://localhost:5001/api/polymarket/trending?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setTrendingMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));

    fetch('http://localhost:5001/api/polymarket/politics?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setPoliticsMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));

    fetch('http://localhost:5001/api/polymarket/crypto?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setCryptoMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));

    fetch('http://localhost:5001/api/polymarket/popculture?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setPopCultureMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));

    fetch('http://localhost:5001/api/polymarket/finance?limit=10')
      .then(res => res.json())
      .then((markets) => {
        const normalized = Array.isArray(markets)
          ? markets.map(normalizeMarket)
          : [];
        setFinanceMarkets(normalized);
      })
      .catch(err => console.error("❌ Error:", err));
  }, []);

  return (
    <>
      <Banner
        market={marketData.featured}
        onMoreInfo={() => setSelectedMarket(marketData.featured)}
      />
      
      <div className="app__rows">
        <MarketRow
          title="Trending Markets"
          markets={trendingMarkets.length > 0 ? trendingMarkets : marketData.trending}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Politics"
          markets={politicsMarkets.length > 0 ? politicsMarkets : marketData.politics}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Crypto"
          markets={cryptoMarkets.length > 0 ? cryptoMarkets : marketData.crypto}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Sports"
          markets={sportsMarkets.length > 0 ? sportsMarkets : marketData.sports}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Pop Culture"
          markets={popCultureMarkets.length > 0 ? popCultureMarkets : marketData.popCulture}
          onSelectMarket={setSelectedMarket}
        />
        <MarketRow
          title="Finance"
          markets={financeMarkets.length > 0 ? financeMarkets : marketData.business}
          onSelectMarket={setSelectedMarket}
        />
      </div>

      <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </>
  );
}

export default HomeScreen;
