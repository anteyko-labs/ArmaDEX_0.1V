import React, { useState } from 'react';
import { Shield, TrendingUp, Wallet, BarChart3, Settings, LogOut } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { TradingInterface } from '../components/TradingInterface';
import { ProfessionalTradingInterface } from '../components/ProfessionalTradingInterface';
import { TradingLogs } from '../components/TradingLogs';
import { PersistentBotBalances } from '../components/PersistentBotBalances';
import { DatabaseViewer } from '../components/DatabaseViewer';
import { realBotService } from '../services/realBotService';
import { tradingEngine } from '../services/tradingEngine';
import { TradingEngineView } from '../components/TradingEngineView';
import { BatchTradingTest } from '../components/BatchTradingTest';
import { HistoryViewer } from '../components/HistoryViewer';
import { RealMEVProtection } from '../components/RealMEVProtection';
import { SimpleTokenManagement } from '../components/SimpleTokenManagement';
import { TradingViewTicker } from '../components/TradingViewTicker';
import { SimpleTicker } from '../components/SimpleTicker';
import { MockTicker } from '../components/MockTicker';
import { TradingViewMarketOverview } from '../components/TradingViewMarketOverview';
import { TradingTools } from '../components/TradingTools';
import { Card } from '../components/Card';
import { useWeb3 } from '../providers/RealWeb3Provider';

type TabType = 'trading' | 'mev' | 'tokens' | 'logs' | 'bots' | 'database' | 'analytics' | 'tools' | 'engine' | 'batchtest' | 'history';

interface DashboardProps {
  onDisconnect: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onDisconnect }) => {
  const [activeTab, setActiveTab] = useState<TabType>('trading');
  const { address, balance, chainId, getShortAddress } = useWeb3();
  
  // Инициализируем торговую систему
  React.useEffect(() => {
    realBotService.initialize();
    tradingEngine.initialize(); // Инициализируем tradingEngine
    tradingEngine.startBatchProcessor(); // Запускаем автоматический батчер
  }, []);
  
  const walletAddress = address ? getShortAddress(address) : '0x742d...4f2a';
  const balanceFormatted = balance ? `${balance} ETH` : '0.0000 ETH';
  const isSepolia = chainId === 11155111; // Sepolia chain ID

  return (
    <div className="min-h-screen bg-black">
      {/* Mock Ticker */}
      <div className="bg-dark-gray border-b border-medium-gray">
        <MockTicker 
          symbols={['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'AVAXUSD', 'MATICUSD', 'LINKUSD']}
          height={50}
          className="px-6 py-2"
        />
      </div>
      
      <nav className="border-b border-medium-gray bg-dark-gray">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-primary" />
                <span className="text-2xl font-bold">ArmaDEX</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'trading' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('trading')}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Trading
                </Button>
                <Button
                  variant={activeTab === 'mev' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('mev')}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  MEV Protection
                </Button>
                <Button
                  variant={activeTab === 'tokens' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('tokens')}
                >
                  <Wallet className="w-4 h-4 inline mr-2" />
                  Tokens
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Analytics
                </Button>
                <Button
                  variant={activeTab === 'logs' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('logs')}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Logs
                </Button>
                <Button
                  variant={activeTab === 'bots' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('bots')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Bots
                </Button>
                <Button
                  variant={activeTab === 'database' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('database')}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Database
                </Button>
                <Button
                  variant={activeTab === 'tools' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('tools')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Tools
                </Button>
                <Button
                  variant={activeTab === 'engine' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('engine')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Engine
                </Button>
                <Button
                  variant={activeTab === 'batchtest' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('batchtest')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Batch Test
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setActiveTab('history')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  History
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <StatusIndicator status="active" label="MEV Protected" pulse />

              <div className="flex items-center gap-3 px-4 py-2 bg-medium-gray rounded-lg border border-text-muted/20">
                <Wallet className="w-5 h-5 text-blue-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-text-muted">Balance</span>
                  <span className="text-sm font-mono font-semibold">{balanceFormatted}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-medium-gray rounded-lg border border-green-profit/20">
                <div className={`w-2 h-2 rounded-full animate-pulse-soft ${isSepolia ? 'bg-green-profit' : 'bg-red-500'}`} />
                <span className="text-sm font-mono">{walletAddress}</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-medium-gray rounded-lg border border-text-muted/20">
                <div className="flex flex-col">
                  <span className="text-xs text-text-muted">Network</span>
                  <span className={`text-sm font-mono ${isSepolia ? 'text-green-400' : 'text-red-400'}`}>
                    {isSepolia ? 'Sepolia' : 'Wrong Network'}
                  </span>
                </div>
              </div>

              <Button variant="secondary" size="small">
                <Settings className="w-4 h-4" />
              </Button>

              <Button variant="secondary" size="small" onClick={onDisconnect}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="animate-fade-in">
          {activeTab === 'trading' && <ProfessionalTradingInterface />}
          {activeTab === 'mev' && <RealMEVProtection />}
          {activeTab === 'tokens' && <SimpleTokenManagement />}
          {activeTab === 'logs' && <TradingLogs logs={realBotService.getTrades()} />}
          {activeTab === 'bots' && <PersistentBotBalances bots={realBotService.getBots()} />}
          {activeTab === 'database' && <DatabaseViewer />}
          {activeTab === 'tools' && <TradingTools />}
          {activeTab === 'engine' && <TradingEngineView />}
          {activeTab === 'batchtest' && <BatchTradingTest />}
          {activeTab === 'history' && <HistoryViewer />}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
                    <TradingViewMarketOverview
                      symbols={[
                        { proName: 'BINANCE:BTCUSD', title: 'Bitcoin' },
                        { proName: 'BINANCE:ETHUSD', title: 'Ethereum' },
                        { proName: 'BINANCE:ADAUSD', title: 'Cardano' },
                        { proName: 'BINANCE:SOLUSD', title: 'Solana' },
                        { proName: 'BINANCE:DOTUSD', title: 'Polkadot' },
                        { proName: 'BINANCE:AVAXUSD', title: 'Avalanche' },
                        { proName: 'BINANCE:MATICUSD', title: 'Polygon' },
                        { proName: 'BINANCE:LINKUSD', title: 'Chainlink' }
                      ]}
                      height={400}
                      className="w-full"
                    />
                  </div>
                </Card>
                
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Trading Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Total Volume (24h)</span>
                        <span className="font-semibold text-green-profit">$2.1M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Active Trades</span>
                        <span className="font-semibold">1,247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">MEV Protected</span>
                        <span className="font-semibold text-blue-primary">100%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Avg. Slippage</span>
                        <span className="font-semibold text-green-profit">0.12%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
