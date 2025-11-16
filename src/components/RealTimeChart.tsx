import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useRealData } from '../hooks/useRealData';

interface RealTimeChartProps {
  symbol: string;
  timeframe?: '1h' | '4h' | '1d';
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ 
  symbol, 
  timeframe = '1h' 
}) => {
  const { getTokenPrice, getTokenChange } = useRealData();
  const [historicalData, setHistoricalData] = useState<Array<{ price: number; timestamp: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const price = getTokenPrice(symbol);
    const priceChange = getTokenChange(symbol);
    
    setCurrentPrice(price);
    setChange(priceChange);
  }, [symbol, getTokenPrice, getTokenChange]);

  // Simple chart visualization (in real app, use Chart.js, D3, or TradingView)
  const renderSimpleChart = () => {
    if (loading || historicalData.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-primary"></div>
        </div>
      );
    }

    const maxPrice = Math.max(...historicalData.map(d => d.price));
    const minPrice = Math.min(...historicalData.map(d => d.price));
    const priceRange = maxPrice - minPrice;

    return (
      <div className="relative h-32 w-full">
        <svg width="100%" height="100%" className="overflow-visible">
          <polyline
            fill="none"
            stroke={change >= 0 ? "#10B981" : "#EF4444"}
            strokeWidth="2"
            points={historicalData.map((point: { price: number; timestamp: number }, index: number) => {
              const x = (index / (historicalData.length - 1)) * 100;
              const y = 100 - ((point.price - minPrice) / priceRange) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-dark-gray border border-medium-gray rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-primary" />
          <span className="text-lg font-semibold">{symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-profit" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-loss" />
          )}
          <span className={`text-sm font-medium ${
            change >= 0 ? 'text-green-profit' : 'text-red-loss'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-white">
          ${currentPrice.toFixed(2)}
        </div>
        <div className="text-sm text-text-muted">
          {timeframe === '1h' ? '1 Hour' : timeframe === '4h' ? '4 Hours' : '1 Day'} Chart
        </div>
      </div>

      <div className="h-32">
        {renderSimpleChart()}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-text-muted">24h High</div>
          <div className="text-sm font-semibold text-green-profit">
            ${(currentPrice * 1.05).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">24h Low</div>
          <div className="text-sm font-semibold text-red-loss">
            ${(currentPrice * 0.95).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Volume</div>
          <div className="text-sm font-semibold text-white">
            ${(Math.random() * 1000000).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
