const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  Accept: "application/json",
};

const normalizeOutcome = (o) => ({
  id: String(o.id ?? o._id ?? o.key ?? Math.random().toString(36).slice(2)),
  name: o.name ?? o.title ?? "Option",
  price:
    typeof o.probability === "number"
      ? o.probability
      : typeof o.price === "number"
      ? o.price
      : 0.5,
});

const mapEventToMarket = (ev) => {
  let outcomes = [];

  if (Array.isArray(ev.outcomes) && ev.outcomes.length) {
    outcomes = ev.outcomes;
  } else if (Array.isArray(ev.selections) && ev.selections.length) {
    outcomes = ev.selections;
  } else if (Array.isArray(ev.markets) && ev.markets[0]?.outcomes) {
    outcomes = ev.markets[0].outcomes;
  } else if (Array.isArray(ev.choices)) {
    outcomes = ev.choices;
  } else if (ev.outcomes && typeof ev.outcomes === "object" && !Array.isArray(ev.outcomes)) {
    outcomes = Object.values(ev.outcomes);
  }

  const mappedOutcomes =
    Array.isArray(outcomes) && outcomes.length > 0
      ? outcomes.map(normalizeOutcome)
      : [
          { id: "yes", name: "Yes", price: 0.5 },
          { id: "no", name: "No", price: 0.5 },
        ];

  return {
    id: String(ev.id ?? ev._id ?? ev.key ?? Math.random().toString(36).slice(2)),
    question: ev.title ?? ev.name ?? ev.question ?? "Untitled market",
    description: ev.description ?? ev.longDescription ?? "",
    image: ev.image ?? ev.coverImage ?? undefined,
    volume: Number(ev.volume ?? ev.totalVolume ?? 0),
    liquidity: Number(ev.liquidity ?? 0),
    endDate: ev.endDate ?? ev.startDate ?? new Date().toISOString(),
    category: ev.category ?? ev.sport ?? "Markets",
    outcomes: mappedOutcomes,
    active: ev.active !== false,
    closed: ev.closed === true,
    createdAt: ev.createdAt ?? ev.startDate ?? new Date().toISOString(),
    updatedAt: ev.updatedAt ?? new Date().toISOString(),
  };
};

export async function fetchSportsMarkets(limit = 10) {
  try {
    const params = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: String(limit * 2),
    });

    const url = `${GAMMA_API_BASE}/events?${params.toString()}`;
    console.log("🔍 Fetching sports markets from:", url);

    const res = await fetch(url, { headers: DEFAULT_HEADERS });

    if (!res.ok) {
      console.error(`❌ API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    console.log(`✅ Got ${data.length} items from API`);

    const sportsEvents = data.filter(
      (ev) =>
        ev.category?.toLowerCase().includes("sport") ||
        ev.sport ||
        ev.category?.toLowerCase().includes("nfl") ||
        ev.category?.toLowerCase().includes("nba") ||
        ev.category?.toLowerCase().includes("soccer") ||
        ev.category?.toLowerCase().includes("football") ||
        ev.category?.toLowerCase().includes("basketball") ||
        ev.category?.toLowerCase().includes("baseball")
    );

    console.log(`🏈 Filtered to ${sportsEvents.length} sports events`);

    return sportsEvents.slice(0, limit).map(mapEventToMarket);
  } catch (error) {
    console.error("❌ Error fetching sports markets:", error);
    return [];
  }
}

export async function fetchTopMarketsByVolume(limit = 10) {
  try {
    const params = new URLSearchParams({
      active: "true",
      closed: "false",
      limit: String(limit * 2),
    });

    const url = `${GAMMA_API_BASE}/events?${params.toString()}`;
    console.log("🔍 Fetching top volume markets from:", url);

    const res = await fetch(url, { headers: DEFAULT_HEADERS });

    if (!res.ok) {
      console.error(`❌ API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    console.log(`✅ Got ${data.length} items from API`);

    const topEvents = data
      .sort((a, b) => {
        const volA = Number(a.volume ?? a.totalVolume ?? 0);
        const volB = Number(b.volume ?? b.totalVolume ?? 0);
        return volB - volA;
      })
      .slice(0, limit);

    console.log(`💰 Top ${topEvents.length} markets by volume`);

    return topEvents.map(mapEventToMarket);
  } catch (error) {
    console.error("❌ Error fetching top markets by volume:", error);
    return [];
  }
}