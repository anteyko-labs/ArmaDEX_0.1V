import React, { useState, useEffect } from 'react';
import { Wallet, Star } from 'lucide-react';
import { Button } from './Button';
import { useDirectWeb3 } from '../hooks/useDirectWeb3';
import { useRealData } from '../hooks/useRealData';
import { CleanTradingViewWidget } from './CleanTradingViewWidget';
import { useSimpleBalance } from '../hooks/useSimpleBalance';
import { useRealExchange } from '../hooks/useRealExchange';
import { SimpleBalanceTest } from './SimpleBalanceTest';
import { simpleMintService } from '../services/simpleMintService';
import { simpleTradingService } from '../services/simpleTradingService';
import { realBotService } from '../services/realBotService';
import { userTradingService } from '../services/userTradingService';
import { userOrderService } from '../services/userOrderService';
import { userBalanceService } from '../services/userBalanceService';
import { TradingLogs } from './TradingLogs';
import { BotBalances } from './BotBalances';
import { realTradingSystemV2 } from '../services/realTradingSystemV2';

interface TradingPair {
  id: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  high24h: number;
  low24h: number;
}

interface OrderBookEntry {
  id?: string;
  botId?: string;
  side?: 'buy' | 'sell';
  token?: string;
  amount?: number;
  size?: number;
  price: number;
  total: number;
  timestamp?: number;
  filled?: boolean;
  orders?: number;
}

export const ProfessionalTradingInterface: React.FC = () => {
  const { address, provider, signer, connect } = useDirectWeb3();
  const { tradingPairs } = useRealData();

  // Простой сервис для балансов
  const {
    balances: simpleBalances,
    totalValue: simpleTotalValue,
    loadBalances
  } = useSimpleBalance();

  // Реальные курсы обмена
  const {
    exchangeRates
  } = useRealExchange();

  // Инициализируем сервисы
  useEffect(() => {
    if (provider && signer) {
      const initializeServices = async () => {
        simpleMintService.initialize(provider, signer);
        simpleTradingService.initialize(provider, signer);
        realBotService.initialize();
        userTradingService.initialize(provider, signer);
        await userBalanceService.initialize(provider, signer);
        
        // Добавляем BTC токены пользователю для тестирования
        if (address) {
          userBalanceService.addBTCTokensToUser(address, 1); // 1 BTC для тестирования
        }
      };
      
      initializeServices();
    }
  }, [provider, signer, address]);
  
  // State for trading
  const [selectedPair] = useState<TradingPair | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [activeTab, setActiveTab] = useState<'trading' | 'logs' | 'bots'>('trading');
  
  // РЕАЛЬНЫЙ ордербук - пустой по умолчанию, заполняется из ботов
  const [orderBook, setOrderBook] = useState<{
    asks: OrderBookEntry[];
    bids: OrderBookEntry[];
  }>({
    asks: [],
    bids: []
  });

  // Real data fallback with current prices
  const mockPairs: TradingPair[] = [
    { id: 'BTC/USDT', name: 'BTC/USDT', price: 110203, change: 0.52, volume: '25B', high24h: 111000, low24h: 109000 },
    { id: 'ETH/USDT', name: 'ETH/USDT', price: 3907.59, change: 1.47, volume: '15B', high24h: 3950, low24h: 3850 },
    { id: 'ADA/USDT', name: 'ADA/USDT', price: 0.646, change: 1.04, volume: '800M', high24h: 0.65, low24h: 0.64 },
    { id: 'SOL/USDT', name: 'SOL/USDT', price: 190.21, change: 0.21, volume: '2B', high24h: 195, low24h: 185 },
    { id: 'DOT/USDT', name: 'DOT/USDT', price: 3.04, change: 2.41, volume: '300M', high24h: 3.1, low24h: 2.9 },
    { id: 'AVAX/USDT', name: 'AVAX/USDT', price: 19.30, change: -0.60, volume: '500M', high24h: 19.8, low24h: 19.0 },
    { id: 'MATIC/USDT', name: 'MATIC/USDT', price: 0.85, change: 1.8, volume: '200M', high24h: 0.88, low24h: 0.82 },
    { id: 'LINK/USDT', name: 'LINK/USDT', price: 17.56, change: 1.57, volume: '400M', high24h: 18.0, low24h: 17.0 },
  ];

  const displayPairs = tradingPairs.length > 0 ? tradingPairs : mockPairs;
  const currentPair = selectedPair || displayPairs[0];


  // Update order book and prices every 1 second for fast updates
  useEffect(() => {
    const updateOrderBook = () => {
      try {
        console.log('🔄 Обновление ордербука...');
        
        // Получаем РЕАЛЬНЫЕ ордера ботов
        const botOrders = realBotService.getOrderBook();
        console.log(`📊 Боты создали: ${botOrders.bids.length} bid, ${botOrders.asks.length} ask`);
        
        // Получаем пользовательские ордера
        const userOrders = userOrderService.getOrderBook();
        console.log(`👤 Пользователь создал: ${userOrders.bids.length} bid, ${userOrders.asks.length} ask`);
        
        // Объединяем РЕАЛЬНЫЕ ордера
        const combinedOrders = {
          bids: [...botOrders.bids, ...userOrders.bids]
            .sort((a, b) => b.price - a.price)
            .slice(0, 9),
          asks: [...botOrders.asks, ...userOrders.asks]
            .sort((a, b) => a.price - b.price)
            .slice(0, 9)
        };
        
        console.log(`✅ Итоговый ордербук: ${combinedOrders.bids.length} bid, ${combinedOrders.asks.length} ask`);
        
        // Показываем примеры ордеров
        if (combinedOrders.bids.length > 0) {
          const bestBid = combinedOrders.bids[0];
          console.log(`📈 Лучший bid: ${bestBid.amount?.toFixed(3) || bestBid.size} ${bestBid.token || 'BTC'} @ $${bestBid.price.toFixed(2)}`);
        }
        
        if (combinedOrders.asks.length > 0) {
          const bestAsk = combinedOrders.asks[0];
          console.log(`📉 Лучший ask: ${bestAsk.amount?.toFixed(3) || bestAsk.size} ${bestAsk.token || 'BTC'} @ $${bestAsk.price.toFixed(2)}`);
        }
        
        setOrderBook(combinedOrders);
      } catch (error) {
        console.error('❌ Ошибка обновления ордербука:', error);
      }
    };

    updateOrderBook();
    const interval = setInterval(updateOrderBook, 2000); // Обновление каждые 2 секунды

    return () => clearInterval(interval);
  }, [currentPair?.id]); // Только при изменении пары

  // Real trading functions with real exchange rates
  const handleTrade = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      alert('Please enter a valid price for limit order');
      return;
    }

    try {
      const tokenSymbol = currentPair?.id?.split('/')[0] || 'BTC';
      const tradePrice = orderType === 'limit' ? parseFloat(price) : currentPair?.price || 65000;
      
      // Если это рыночный ордер, сразу выполняем БЕЗ создания ордера
      if (orderType === 'market') {
        const result = side === 'buy' 
          ? await userTradingService.buyToken(tokenSymbol, amount)
          : await userTradingService.sellToken(tokenSymbol, amount);
        
        if (result.success) {
          alert(`✅ ${side.toUpperCase()} ${amount} ${tokenSymbol} executed successfully!`);
          // Обновляем балансы после успешной торговли
          loadBalances();
        } else {
          alert(`❌ Trade failed: ${result.error}`);
        }
      } else {
        // Лимитный ордер - создаем и добавляем в ордербук
        let order;
        try {
          order = await userOrderService.createOrder(
            address,
            side,
            tokenSymbol,
            parseFloat(amount),
            tradePrice
          );
          alert(`📝 ${side.toUpperCase()} ${amount} ${tokenSymbol} @ $${tradePrice} order placed!`);
          console.log('📊 Order ID:', order.id);
        } catch (error: any) {
          alert(`❌ Ошибка создания ордера: ${error.message}`);
          return;
        }
      }
        
      // Обновляем балансы
      await loadBalances();
      
      // Reset form
      setAmount('');
      setPrice('');
      
    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Order placement failed. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '0.000';
    }
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    });
  };

  const formatSize = (size: number) => {
    if (typeof size !== 'number' || isNaN(size)) {
      return '0.00';
    }
    return size.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatTotal = (total: number) => {
    if (typeof total !== 'number' || isNaN(total)) {
      return '0.00';
    }
    return total.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold">BTC/USDT</span>
              <span className="text-sm text-gray-400">Spot</span>
            </div>
            
                 <div className="flex items-center space-x-6">
                 <div className="flex items-center space-x-3">
                   <div className="text-2xl font-bold">
                     {exchangeRates.BTC ? formatPrice(exchangeRates.BTC) : formatPrice(currentPair?.price || 110203)}
                   </div>
                   <div className={`text-sm font-semibold ${currentPair?.change && currentPair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {currentPair?.change && currentPair.change >= 0 ? '+' : ''}{currentPair?.change?.toFixed(2)}%
                   </div>
                   {exchangeRates.BTC && (
                     <div className="text-xs text-blue-400">
                       Real Rate: ${exchangeRates.BTC.toLocaleString()}
                     </div>
                   )}
                 </div>
              
              <div className="text-sm text-gray-400">
                <div>24h Volume: ${formatVolume(Number(currentPair?.volume) || 25000000000)}</div>
                <div>Market Cap: $2.17T</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
                 <div className="text-sm text-gray-400">
                   Trading Balance: ${simpleTotalValue.toFixed(2)}
                 </div>
                 <div className="text-xs text-blue-400">
                  🤖 Bots: {realBotService.getStats().totalBots} | 
                  📊 Orders: {realBotService.getStats().activeOrders} |
                  💰 Fees: ${realBotService.getStats().totalFees}
                 </div>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              {showPortfolio ? 'Hide' : 'Portfolio'}
            </button>
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadBalances();
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              Refresh
            </button>
            <Button variant="secondary" size="small" onClick={connect}>
              <Wallet className="w-4 h-4 mr-2" />
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect'}
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Display */}
      {showPortfolio && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-4">Portfolio</h3>
            
            {/* Simple Balance Test Component */}
            <SimpleBalanceTest />
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <h4 className="text-sm text-gray-400 mb-2">Balances</h4>
                     {simpleBalances.length > 0 ? (
                       simpleBalances.map((balance, index) => (
                         <div key={index} className="flex justify-between text-sm">
                           <span>{balance.symbol}:</span>
                           <span>{balance.balance.toFixed(6)}</span>
                         </div>
                       ))
                     ) : (
                       <div className="text-gray-500 text-sm">
                         Loading balances... (Count: {simpleBalances.length})
                         <br />
                         Debug: {JSON.stringify(simpleBalances)}
                       </div>
                     )}
                   </div>
                   <div>
                     <h4 className="text-sm text-gray-400 mb-2">Positions</h4>
                     {simpleBalances.length > 0 ? (
                       simpleBalances
                         .filter(balance => balance.balance > 0 && balance.symbol !== 'USDT')
                         .map((balance, index) => (
                           <div key={index} className="flex justify-between text-sm">
                             <span>{balance.symbol}:</span>
                             <span className="text-green-400">{balance.balance.toFixed(6)}</span>
                           </div>
                         ))
                     ) : (
                       <div className="text-gray-500 text-sm">Loading positions...</div>
                     )}
                   </div>
                 </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                 <div className="flex justify-between text-sm mb-2">
                   <span>Total Value:</span>
                   <span className="font-semibold">${simpleTotalValue.toFixed(2)}</span>
                 </div>
              <div className="flex justify-between text-sm">
                <span>Total PnL:</span>
                <span className="font-semibold text-gray-400">
                  $0.00 (0.00%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

           {/* Tabs */}
           <div className="bg-gray-800 border-b border-gray-700 px-6 py-2">
             <div className="flex space-x-4">
               <button
                 onClick={() => setActiveTab('trading')}
                 className={`px-4 py-2 rounded text-sm font-medium ${
                   activeTab === 'trading'
                     ? 'bg-blue-600 text-white'
                     : 'text-gray-400 hover:text-white'
                 }`}
               >
                 Trading
               </button>
               <button
                 onClick={() => setActiveTab('logs')}
                 className={`px-4 py-2 rounded text-sm font-medium ${
                   activeTab === 'logs'
                     ? 'bg-blue-600 text-white'
                     : 'text-gray-400 hover:text-white'
                 }`}
               >
                 Logs
               </button>
               <button
                 onClick={() => setActiveTab('bots')}
                 className={`px-4 py-2 rounded text-sm font-medium ${
                   activeTab === 'bots'
                     ? 'bg-blue-600 text-white'
                     : 'text-gray-400 hover:text-white'
                 }`}
               >
                 Bots
               </button>
             </div>
           </div>

           {/* Main Content */}
           {activeTab === 'trading' ? (
             <div className="flex-1 flex">
        {/* Main Chart Area - Left Column - Only TradingView */}
        <div className="flex-1 flex flex-col">
          {/* Chart - Full Height - Only TradingView */}
          <div className="flex-1 bg-gray-900 relative">
            <CleanTradingViewWidget
              symbol="BINANCE:BTCUSDT"
              height={650}
            />
          </div>
        </div>

        {/* Order Book - Center Column - Full Height */}
        <div className="w-60 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-400 text-sm">Order Book</h3>
              <select className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                <option>0.001</option>
                <option>0.01</option>
                <option>0.1</option>
              </select>
            </div>
          </div>
          
          <div className="p-3 space-y-1 flex-1 overflow-y-auto">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2">
              <div className="text-right">Price</div>
              <div className="text-right">Size</div>
              <div className="text-right">Total</div>
            </div>
            
            {/* Sell Orders */}
            {orderBook.asks && orderBook.asks.length > 0 ? orderBook.asks.map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-gray-700 cursor-pointer py-1 px-1 rounded relative">
                {/* Red background gradient for sell orders */}
                <div 
                  className="absolute inset-0 bg-red-500 opacity-5 rounded"
                  style={{ width: `${((ask.total || ask.amount * ask.price || 0) / 30) * 100}%` }}
                />
                <span className="text-right text-red-400 font-mono relative z-10">{formatPrice(ask.price || 0)}</span>
                <span className="text-right text-gray-300 font-mono relative z-10">{formatSize(ask.size || ask.amount || 0)}</span>
                <span className="text-right text-gray-400 font-mono relative z-10">{formatTotal(ask.total || ask.amount * ask.price || 0)}</span>
              </div>
            )) : (
              <div className="text-center text-gray-500 text-xs py-4">
                Загрузка ордеров продажи...
              </div>
            )}
            
            {/* Spread */}
            <div className="text-center py-1 text-xs text-gray-400 border-t border-b border-gray-700">
              <div className="flex justify-center items-center space-x-1">
                <span>Spread</span>
                <span className="text-white font-mono">0.001</span>
                <span>(0.003%)</span>
              </div>
            </div>
            
            {/* Buy Orders */}
            {orderBook.bids && orderBook.bids.length > 0 ? orderBook.bids.map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-xs hover:bg-gray-700 cursor-pointer py-1 px-1 rounded relative">
                {/* Green background gradient for buy orders */}
                <div 
                  className="absolute inset-0 bg-green-500 opacity-5 rounded"
                  style={{ width: `${((bid.total || bid.amount * bid.price || 0) / 30) * 100}%` }}
                />
                <span className="text-right text-green-400 font-mono relative z-10">{formatPrice(bid.price || 0)}</span>
                <span className="text-right text-gray-300 font-mono relative z-10">{formatSize(bid.size || bid.amount || 0)}</span>
                <span className="text-right text-gray-400 font-mono relative z-10">{formatTotal(bid.total || bid.amount * bid.price || 0)}</span>
              </div>
            )) : (
              <div className="text-center text-gray-500 text-xs py-4">
                Загрузка ордеров покупки...
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel - Right Column - Reduced Width - No Shutter */}
        <div className="w-60 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
          {/* Top Section - Order Type and Inputs - Flexible Height */}
          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {/* Order Type Tabs */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOrderType('market')}
                      className={`px-2 py-1 rounded text-xs ${
                        orderType === 'market'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => setOrderType('limit')}
                      className={`px-2 py-1 rounded text-xs ${
                        orderType === 'limit'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Limit
                    </button>
                  </div>

            {/* Buy/Sell Buttons - Moved Back Up */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('buy')}
                className={`py-2 rounded font-semibold text-sm ${
                  side === 'buy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`py-2 rounded font-semibold text-sm ${
                  side === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sell
              </button>
            </div>

            {/* Amount Input - Fixed Width */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Size</label>
              <div className="flex w-full">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-l px-2 py-1 text-white text-sm min-w-0"
                />
                <select className="bg-gray-700 border border-gray-600 rounded-r px-1 text-white text-sm w-16">
                  <option>BTC</option>
                  <option>USDT</option>
                </select>
              </div>
            </div>

            {/* Price Input (for limit orders) */}
            {orderType === 'limit' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            )}

            {/* Percentage Slider */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Percentage</label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-700 rounded p-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Order Value:</span>
                <span className="text-white">
                  {amount && currentPair ? 
                    `$${(parseFloat(amount) * currentPair.price).toFixed(2)}` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Slippage:</span>
                <span className="text-white">Est: 0% / Max: 8.00%</span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Execute Button Fixed at Bottom */}
          <div className="p-3 border-t border-gray-700 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + 5px)' }}>
            {/* Exchange Rates Info */}
            {exchangeRates.BTC && (
              <div className="bg-green-600/20 border border-green-600/50 rounded p-2 mb-3">
                <div className="text-xs text-green-300 mb-1">
                  💱 Real Rates:
                </div>
                <div className="text-xs space-y-1">
                  <div>BTC: ${exchangeRates.BTC.toLocaleString()}</div>
                  <div>ETH: ${exchangeRates.ETH.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Execute Trade Button - Main Button at Bottom */}
            <button
              onClick={handleTrade}
              className={`w-full py-3 rounded font-semibold text-sm mb-2 ${
                side === 'buy'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {side === 'buy' ? 'Buy' : 'Sell'} BTC/USDT
            </button>

            {/* Get 10K USDT Button */}
            {address && (
              <button 
                onClick={async () => {
                  try {
                    const result = await simpleTradingService.mintUSDT(address, 10000);
                    if (result.success) {
                      alert('✅ 10,000 USDT added to your wallet!');
                      await loadBalances();
                    } else {
                      alert(`❌ Failed: ${result.error}`);
                    }
                  } catch (error) {
                    alert('❌ Error getting USDT');
                  }
                }}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm mb-2"
              >
                Get 10K USDT
              </button>
            )}

            {/* Connect Wallet Button */}
            {!address && (
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-sm">
                Connect
              </button>
            )}
          </div>
           </div>
         </div>
           ) : activeTab === 'logs' ? (
             <div className="flex-1">
               <TradingLogs logs={realTradingSystemV2.getTradeLogs()} />
             </div>
           ) : (
             <div className="flex-1">
               <BotBalances balances={realTradingSystemV2.getBotBalances()} />
             </div>
           )}

           {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </span>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-white">Docs</a>
          <a href="#" className="hover:text-white">Support</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};
