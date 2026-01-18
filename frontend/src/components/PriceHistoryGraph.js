import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './PriceHistoryGraph.css';

// Color palette - more distinct colors
const COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b'  // Orange/Amber
];

function PriceHistoryGraph({ markets, loading }) {
  if (loading) {
    return (
      <div className="priceHistoryGraph">
        <div className="priceHistoryGraph__loading">Loading price history...</div>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="priceHistoryGraph">
        <div className="priceHistoryGraph__empty">No market data available</div>
      </div>
    );
  }

  // Memoize chart data transformation to avoid recalculating on every render
  const chartData = useMemo(() => {
    // Limit to max 150 data points per market for performance
    const MAX_POINTS = 150;
    
    // Pre-process each market's data to limit points and create lookup maps
    const marketData = markets.map((market, index) => {
      if (!market.priceHistory || market.priceHistory.length === 0) {
        return { index, points: [], lookup: new Map() };
      }
      
      // Limit points if too many
      let points = market.priceHistory;
      if (points.length > MAX_POINTS) {
        const step = Math.ceil(points.length / MAX_POINTS);
        points = points.filter((_, i) => i % step === 0 || i === points.length - 1);
      }
      
      // Create lookup map for faster access
      const lookup = new Map();
      points.forEach(point => {
        const ts = typeof point.t === 'number' ? point.t : parseInt(point.t);
        lookup.set(ts, point);
      });
      
      return { index, points, lookup };
    });
    
    // Get all unique timestamps (in seconds)
    const allTimestamps = new Set();
    marketData.forEach(({ points }) => {
      points.forEach(point => {
        const ts = typeof point.t === 'number' ? point.t : parseInt(point.t);
        allTimestamps.add(ts);
      });
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    
    // Limit total timestamps if still too many
    let finalTimestamps = sortedTimestamps;
    if (sortedTimestamps.length > MAX_POINTS) {
      const step = Math.ceil(sortedTimestamps.length / MAX_POINTS);
      finalTimestamps = sortedTimestamps.filter((_, i) => i % step === 0 || i === sortedTimestamps.length - 1);
    }
    
    // Create chart data array
    return finalTimestamps.map(timestampSeconds => {
      const dataPoint = { timestamp: new Date(timestampSeconds * 1000) };
      
      marketData.forEach(({ index, lookup }) => {
        // Try exact match first, then find closest
        let pricePoint = lookup.get(timestampSeconds);
        
        if (!pricePoint) {
          // Find closest timestamp
          const timestamps = Array.from(lookup.keys());
          let closestTs = timestamps[0];
          let minDiff = Math.abs(closestTs - timestampSeconds);
          
          for (const ts of timestamps) {
            const diff = Math.abs(ts - timestampSeconds);
            if (diff < minDiff) {
              minDiff = diff;
              closestTs = ts;
            }
          }
          pricePoint = lookup.get(closestTs);
        }
        
        if (pricePoint) {
          const price = parseFloat(pricePoint.p);
          if (!isNaN(price)) {
            dataPoint[`market_${index}`] = price * 100;
          }
        }
      });
      
      return dataPoint;
    });
  }, [markets]);
  
  if (chartData.length === 0) {
    return (
      <div className="priceHistoryGraph">
        <div className="priceHistoryGraph__empty">No price history data available for these markets</div>
      </div>
    );
  }

  // Format date for X-axis
  const formatDate = (date) => {
    const d = new Date(date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
  };

  // Get current price for each market (for legend)
  const getCurrentPrice = (market) => {
    if (!market.priceHistory || market.priceHistory.length === 0) return 0;
    const latest = market.priceHistory[market.priceHistory.length - 1];
    const price = parseFloat(latest.p);
    // Price might already be 0-1 (probability) or might be in cents, handle both
    const pricePercent = price > 1 ? price : price * 100;
    return pricePercent.toFixed(1);
  };

  return (
    <div className="priceHistoryGraph">
      <div className="priceHistoryGraph__legend">
        {markets.map((market, index) => (
          <div key={market.id || index} className="priceHistoryGraph__legendItem">
            <div
              className="priceHistoryGraph__legendDot"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="priceHistoryGraph__legendName">
              {market.title || market.question || 'Untitled Market'}
            </span>
            <span className="priceHistoryGraph__legendPrice">
              {getCurrentPrice(market)}%
            </span>
          </div>
        ))}
      </div>
      <div className="priceHistoryGraph__chart">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            syncId="priceHistory"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#808080"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#808080"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#222',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff'
              }}
              labelFormatter={(value) => formatDate(value)}
              formatter={(value) => [`${parseFloat(value).toFixed(1)}%`, 'Price']}
              animationDuration={0}
            />
            {markets.map((market, index) => (
              <Line
                key={market.id || index}
                type="monotone"
                dataKey={`market_${index}`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={0}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PriceHistoryGraph;
