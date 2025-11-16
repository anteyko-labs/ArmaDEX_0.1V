import React, { useState, useEffect } from 'react';
import { tradingService, OrderBook as OrderBookType } from '../services/tradingService';

interface OrderBookProps {
  pair: string;
  basePrice: number;
  className?: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ pair, basePrice, className = '' }) => {
  const [orderBook, setOrderBook] = useState<OrderBookType>({
    asks: [],
    bids: [],
    lastUpdate: new Date().toISOString()
  });
  const [precision, setPrecision] = useState(0.001);

  useEffect(() => {
    const updateOrderBook = () => {
      const newOrderBook = tradingService.getOrderBook(pair, basePrice);
      setOrderBook(newOrderBook);
    };

    // Update order book every 500ms for fast updates
    updateOrderBook();
    const interval = setInterval(updateOrderBook, 500);

    return () => clearInterval(interval);
  }, [pair, basePrice]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 8 
    });
  };

  const formatSize = (size: number) => {
    return size.toFixed(3);
  };

  const formatTotal = (total: number) => {
    return total.toFixed(3);
  };

  const getSpread = () => {
    if (orderBook.asks.length === 0 || orderBook.bids.length === 0) return 0;
    const bestAsk = orderBook.asks[0].price;
    const bestBid = orderBook.bids[0].price;
    return bestAsk - bestBid;
  };

  const getSpreadPercentage = () => {
    if (orderBook.asks.length === 0 || orderBook.bids.length === 0) return 0;
    const spread = getSpread();
    const midPrice = (orderBook.asks[0].price + orderBook.bids[0].price) / 2;
    return (spread / midPrice) * 100;
  };

  return (
    <div className={`bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Order Book</h3>
          <select 
            value={precision} 
            onChange={(e) => setPrecision(parseFloat(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          >
            <option value={0.001}>0.001</option>
            <option value={0.01}>0.01</option>
            <option value={0.1}>0.1</option>
            <option value={1}>1</option>
          </select>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="p-4">
        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 mb-2">
          <div className="text-right">Price</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total</div>
        </div>

        {/* Sell Orders (Asks) */}
        <div className="space-y-1 mb-4">
          {orderBook.asks.slice(0, 8).map((ask, index) => (
            <div 
              key={index} 
              className="grid grid-cols-3 gap-4 text-sm hover:bg-gray-700 cursor-pointer py-1 px-2 rounded relative"
            >
              {/* Red background gradient for sell orders */}
              <div 
                className="absolute inset-0 bg-red-500 opacity-5 rounded"
                style={{ width: `${(ask.total / 20) * 100}%` }}
              />
              <div className="text-right text-red-400 font-mono relative z-10">
                {formatPrice(ask.price)}
              </div>
              <div className="text-right text-gray-300 font-mono relative z-10">
                {formatSize(ask.size)}
              </div>
              <div className="text-right text-gray-400 font-mono relative z-10">
                {formatTotal(ask.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="text-center py-2 text-xs text-gray-400 border-t border-b border-gray-700">
          <div className="flex justify-center items-center space-x-2">
            <span>Spread</span>
            <span className="text-white font-mono">{formatPrice(getSpread())}</span>
            <span>({getSpreadPercentage().toFixed(3)}%)</span>
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div className="space-y-1 mt-4">
          {orderBook.bids.slice(0, 8).map((bid, index) => (
            <div 
              key={index} 
              className="grid grid-cols-3 gap-4 text-sm hover:bg-gray-700 cursor-pointer py-1 px-2 rounded relative"
            >
              {/* Green background gradient for buy orders */}
              <div 
                className="absolute inset-0 bg-green-500 opacity-5 rounded"
                style={{ width: `${(bid.total / 20) * 100}%` }}
              />
              <div className="text-right text-green-400 font-mono relative z-10">
                {formatPrice(bid.price)}
              </div>
              <div className="text-right text-gray-300 font-mono relative z-10">
                {formatSize(bid.size)}
              </div>
              <div className="text-right text-gray-400 font-mono relative z-10">
                {formatTotal(bid.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Market Depth Visualization */}
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">Market Depth</div>
          <div className="space-y-1">
            {/* Sell side depth */}
            <div className="flex items-center">
              <div className="w-16 text-xs text-red-400">Sell</div>
              <div className="flex-1 bg-gray-700 rounded h-2 relative">
                <div 
                  className="bg-red-500 h-full rounded"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
            
            {/* Buy side depth */}
            <div className="flex items-center">
              <div className="w-16 text-xs text-green-400">Buy</div>
              <div className="flex-1 bg-gray-700 rounded h-2 relative">
                <div 
                  className="bg-green-500 h-full rounded"
                  style={{ width: '40%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last update: {new Date(orderBook.lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
