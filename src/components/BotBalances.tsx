import React from 'react';
import { Bot, DollarSign } from 'lucide-react';

interface BotBalance {
  name: string;
  address: string;
  balances: {
    USDT: number;
    BTC: number;
    ETH: number;
  };
}

interface BotBalancesProps {
  balances: BotBalance[];
}

export const BotBalances: React.FC<BotBalancesProps> = ({ balances }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getTotalValue = (bot: BotBalance) => {
    // Примерные цены для расчета
    const prices = { USDT: 1, BTC: 110000, ETH: 3000 };
    return bot.balances.USDT * prices.USDT + 
           bot.balances.BTC * prices.BTC + 
           bot.balances.ETH * prices.ETH;
  };

  return (
    <div className="h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bot Balances</h3>
          <div className="text-sm text-gray-400">
            {balances.length} bots
          </div>
        </div>
      </div>

      {/* Balances List */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {balances.length > 0 ? (
          <div className="space-y-2 p-4">
            {balances.map((bot) => (
              <div 
                key={bot.address} 
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">{bot.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatAddress(bot.address)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">USDT</div>
                    <div className="text-sm font-mono text-green-400">
                      {formatAmount(bot.balances.USDT, 0)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">BTC</div>
                    <div className="text-sm font-mono text-orange-400">
                      {formatAmount(bot.balances.BTC, 4)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">ETH</div>
                    <div className="text-sm font-mono text-blue-400">
                      {formatAmount(bot.balances.ETH, 2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Total Value:</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    ${formatAmount(getTotalValue(bot), 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">No bot data</div>
              <div className="text-gray-600 text-sm">
                Bot balances will appear here
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Total Bots</div>
            <div className="text-sm font-semibold">{balances.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Value</div>
            <div className="text-sm font-semibold">
              ${formatAmount(balances.reduce((sum, bot) => sum + getTotalValue(bot), 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
