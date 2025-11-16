import React, { useState, useEffect } from 'react';
import { persistentStorageService } from '../services/persistentStorageService';
import { RealTrade, RealBot } from '../services/realBotService';

interface SystemStats {
  totalBots: number;
  activeOrders: number;
  totalFees: number;
  totalVolume: number;
  lastUpdate: number;
}

interface StorageStats {
  dataSizeKB: number;
  tradesCount: number;
  logsCount: number;
  usersCount: number;
  lastUpdate: number;
}

export const HistoryViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trades' | 'bots' | 'stats' | 'storage'>('trades');
  const [trades, setTrades] = useState<RealTrade[]>([]);
  const [bots, setBots] = useState<RealBot[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    loadData();
    
    // Быстрое обновление истории каждые 2 секунды
    const interval = setInterval(loadData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setTrades(persistentStorageService.getTrades());
    setBots(persistentStorageService.getBots());
    setStats(persistentStorageService.getStats());
    setStorageStats(persistentStorageService.getStorageStats());
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const exportData = () => {
    const data = persistentStorageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearOldData = () => {
    if (confirm('Удалить данные старше 30 дней?')) {
      persistentStorageService.clearOldData(30);
      loadData();
    }
  };

  const clearAllData = () => {
    if (confirm('УДАЛИТЬ ВСЕ ДАННЫЕ? Это действие необратимо!')) {
      persistentStorageService.clearAllData();
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">📊 История Торговли</h2>
        
        {/* Вкладки */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'trades' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            📈 Сделки
          </button>
          <button
            onClick={() => setActiveTab('bots')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'bots' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            🤖 Боты
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            📊 Статистика
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'storage' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            💾 Хранилище
          </button>
        </div>

        {/* Сделки */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">История сделок ({trades.length})</h3>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                📥 Экспорт
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {trades.length === 0 ? (
                <div className="text-gray-400 text-center py-8">Нет сделок</div>
              ) : (
                <div className="space-y-2">
                  {trades.slice(-100).reverse().map((trade, index) => (
                    <div key={trade.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-4">
                          <span className="text-sm text-gray-400">#{trades.length - index}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.side === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {trade.side.toUpperCase()}
                          </span>
                          <span className="text-white font-mono">{trade.amount.toFixed(6)} {trade.token}</span>
                          <span className="text-gray-400">@</span>
                          <span className="text-yellow-400">${trade.price.toFixed(2)}</span>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>{formatTime(trade.timestamp)}</div>
                          <div>{formatAddress(trade.fromAddress)} → {formatAddress(trade.toAddress)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Боты */}
        {activeTab === 'bots' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Боты ({bots.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bots.map((bot) => (
                <div key={bot.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-semibold">{bot.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      bot.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {bot.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {formatAddress(bot.address)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">USDT:</span>
                      <span className="text-white">{bot.balances.USDT.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">BTC:</span>
                      <span className="text-white">{bot.balances.BTC.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ETH:</span>
                      <span className="text-white">{bot.balances.ETH.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Сделок:</span>
                      <span className="text-white">{bot.totalTrades}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Системная статистика</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Всего ботов</div>
                <div className="text-2xl font-bold text-blue-400">{stats.totalBots}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Активных ордеров</div>
                <div className="text-2xl font-bold text-green-400">{stats.activeOrders}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Общие комиссии</div>
                <div className="text-2xl font-bold text-yellow-400">${stats.totalFees.toFixed(2)}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Общий объем</div>
                <div className="text-2xl font-bold text-purple-400">${stats.totalVolume.toFixed(2)}</div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Последнее обновление</div>
              <div className="text-white">{formatTime(stats.lastUpdate)}</div>
            </div>
          </div>
        )}

        {/* Хранилище */}
        {activeTab === 'storage' && storageStats && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Информация о хранилище</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Размер данных</div>
                <div className="text-2xl font-bold text-blue-400">{storageStats.dataSizeKB} KB</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Сделок</div>
                <div className="text-2xl font-bold text-green-400">{storageStats.tradesCount}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Логов</div>
                <div className="text-2xl font-bold text-yellow-400">{storageStats.logsCount}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Пользователей</div>
                <div className="text-2xl font-bold text-purple-400">{storageStats.usersCount}</div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                📥 Экспорт данных
              </button>
              <button
                onClick={clearOldData}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
              >
                🗑️ Очистить старые данные
              </button>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                ⚠️ Очистить все
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
