import React, { useState } from 'react';
import { Coins, TrendingUp, Gift, Lock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  value: number;
  change: number;
  staked: number;
  rewards: number;
  icon: string;
}

export const TokenManagement: React.FC = () => {
  const [tokens] = useState<Token[]>([
    {
      id: 'TSD',
      name: 'ArmaDEX Dollar',
      symbol: 'TSD',
      balance: 5420.50,
      value: 1.05,
      change: 5.67,
      staked: 3000,
      rewards: 145.32,
      icon: 'TSD'
    },
    {
      id: 'TSP',
      name: 'ArmaDEX Protocol',
      symbol: 'TSP',
      balance: 8930.25,
      value: 0.85,
      change: 3.21,
      staked: 5000,
      rewards: 287.45,
      icon: 'TSP'
    },
    {
      id: 'TSN',
      name: 'ArmaDEX Network',
      symbol: 'TSN',
      balance: 12500,
      value: 0.42,
      change: -1.12,
      staked: 10000,
      rewards: 523.67,
      icon: 'TSN'
    },
  ]);

  const [vipLevel] = useState('Gold');
  const [vipProgress] = useState(75);

  const totalValue = tokens.reduce((sum, token) => sum + (token.balance * token.value), 0);
  const totalStaked = tokens.reduce((sum, token) => sum + (token.staked * token.value), 0);
  const totalRewards = tokens.reduce((sum, token) => sum + token.rewards, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Coins className="w-4 h-4" />
            <span className="text-sm">Total Portfolio</span>
          </div>
          <div className="text-3xl font-bold font-mono text-blue-primary">${totalValue.toFixed(2)}</div>
          <div className="text-sm text-green-profit mt-2">+12.45% this month</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Total Staked</span>
          </div>
          <div className="text-3xl font-bold font-mono text-cyan-info">${totalStaked.toFixed(2)}</div>
          <div className="text-sm text-text-secondary mt-2">Earning rewards</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Gift className="w-4 h-4" />
            <span className="text-sm">Total Rewards</span>
          </div>
          <div className="text-3xl font-bold font-mono text-green-profit">${totalRewards.toFixed(2)}</div>
          <div className="text-sm text-green-profit mt-2">Available to claim</div>
        </Card>

        <Card hover={false} className="bg-gradient-to-br from-orange-warning/20 to-transparent border-orange-warning/30">
          <div className="flex items-center gap-2 text-orange-warning mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">VIP Status</span>
          </div>
          <div className="text-2xl font-bold text-orange-warning mb-2">{vipLevel}</div>
          <div className="w-full bg-medium-gray rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-warning to-orange-warning/60 h-2 rounded-full transition-all duration-500"
              style={{ width: `${vipProgress}%` }}
            />
          </div>
          <div className="text-xs text-text-muted mt-2">{vipProgress}% to Platinum</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tokens.map((token) => (
          <Card key={token.id} className="group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                  ${token.id === 'TSD' ? 'bg-gradient-to-br from-blue-primary to-blue-light text-white' : ''}
                  ${token.id === 'TSP' ? 'bg-gradient-to-br from-green-profit to-cyan-info text-black' : ''}
                  ${token.id === 'TSN' ? 'bg-gradient-to-br from-cyan-info to-blue-primary text-white' : ''}
                `}>
                  {token.icon}
                </div>
                <div>
                  <div className="font-semibold text-lg">{token.symbol}</div>
                  <div className="text-sm text-text-muted">{token.name}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${token.change > 0 ? 'text-green-profit' : 'text-red-loss'}`}>
                {token.change > 0 ? '+' : ''}{token.change}%
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Balance</span>
                <span className="font-mono font-semibold">{token.balance.toLocaleString()} {token.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Value</span>
                <span className="font-mono font-semibold text-blue-primary">
                  ${(token.balance * token.value).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Price</span>
                <span className="font-mono text-sm">${token.value.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-medium-gray pt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted text-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Staked
                </span>
                <span className="font-mono text-sm text-cyan-info">{token.staked.toLocaleString()} {token.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Rewards
                </span>
                <span className="font-mono text-sm text-green-profit">${token.rewards.toFixed(2)}</span>
              </div>
              <div className="w-full bg-medium-gray rounded-full h-1.5 mt-3">
                <div
                  className="bg-gradient-to-r from-cyan-info to-green-profit h-1.5 rounded-full"
                  style={{ width: `${(token.staked / (token.balance + token.staked)) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="small" className="text-xs">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Stake
              </Button>
              <Button variant="secondary" size="small" className="text-xs">
                <ArrowDownLeft className="w-3 h-3 mr-1" />
                Unstake
              </Button>
            </div>

            {token.rewards > 0 && (
              <Button variant="primary" size="small" className="w-full mt-2 text-xs">
                <Gift className="w-3 h-3 mr-1" />
                Claim ${token.rewards.toFixed(2)}
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hover={false}>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-profit" />
            Staking Benefits
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-medium-gray rounded-lg">
              <div className="w-8 h-8 bg-green-profit/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-profit" />
              </div>
              <div>
                <div className="font-semibold mb-1">High APY Rewards</div>
                <div className="text-sm text-text-secondary">Earn up to 25% APY on staked tokens</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-medium-gray rounded-lg">
              <div className="w-8 h-8 bg-blue-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-blue-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">Reduced Trading Fees</div>
                <div className="text-sm text-text-secondary">Get up to 50% discount on trading fees</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-medium-gray rounded-lg">
              <div className="w-8 h-8 bg-orange-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-warning" />
              </div>
              <div>
                <div className="font-semibold mb-1">VIP Access</div>
                <div className="text-sm text-text-secondary">Unlock exclusive features and priority support</div>
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-info" />
            Rewards History
          </h3>
          <div className="space-y-3">
            {[
              { date: '2 hours ago', amount: 12.45, token: 'TSD' },
              { date: '1 day ago', amount: 28.90, token: 'TSP' },
              { date: '2 days ago', amount: 45.67, token: 'TSN' },
              { date: '3 days ago', amount: 18.23, token: 'TSD' },
            ].map((reward, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-medium-gray rounded-lg">
                <div>
                  <div className="font-semibold text-sm">Staking Rewards</div>
                  <div className="text-xs text-text-muted">{reward.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-green-profit">${reward.amount}</div>
                  <div className="text-xs text-text-muted">{reward.token}</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="small" className="w-full mt-4">
            View All History
          </Button>
        </Card>
      </div>
    </div>
  );
};
