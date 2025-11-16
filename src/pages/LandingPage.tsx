import React from 'react';
import { Shield, Lock, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface LandingPageProps {
  onStartTrading: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartTrading }) => {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-blue-dark/20 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-primary/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-info/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-primary" />
            <span className="text-2xl font-bold text-white">ArmaDEX</span>
          </div>
          <Button onClick={onStartTrading} size="medium">
            Launch App
          </Button>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-primary/10 border border-blue-primary/30 rounded-full mb-6 animate-fade-in">
            <Shield className="w-4 h-4 text-blue-primary" />
            <span className="text-sm text-blue-light">MEV-Protected Trading Platform</span>
          </div>

          <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
            ArmaDEX
          </h1>
          <p className="text-2xl text-text-secondary mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            MEV-Free Professional Exchange
          </p>
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Trade with confidence knowing your transactions are protected from MEV attacks, front-running, and sandwich attacks.
          </p>

          <div className="flex gap-4 justify-center mb-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button onClick={onStartTrading} size="large">
              Start Trading Now
            </Button>
            <Button variant="secondary" size="large">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            <div className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl font-bold text-green-profit mb-2 font-mono">$1B+</div>
              <div className="text-text-secondary">Protected Volume</div>
            </div>
            <div className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="text-4xl font-bold text-blue-primary mb-2 font-mono">10K+</div>
              <div className="text-text-secondary">Active Traders</div>
            </div>
            <div className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-4xl font-bold text-cyan-info mb-2 font-mono">99.9%</div>
              <div className="text-text-secondary">Protection Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Why Choose ArmaDEX?</h2>
        <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          Advanced MEV protection combined with professional trading tools
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <div className="flex items-center justify-center w-16 h-16 bg-blue-primary/10 rounded-lg mb-4">
              <Shield className="w-8 h-8 text-blue-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">MEV Protection</h3>
            <p className="text-text-secondary">
              Advanced algorithms detect and prevent front-running, sandwich attacks, and other MEV exploits in real-time.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-center w-16 h-16 bg-green-profit/10 rounded-lg mb-4">
              <DollarSign className="w-8 h-8 text-green-profit" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Native Tokens</h3>
            <p className="text-text-secondary">
              Trade TSD, TSP, and TSN tokens with reduced fees and exclusive benefits for token holders.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-center w-16 h-16 bg-cyan-info/10 rounded-lg mb-4">
              <TrendingUp className="w-8 h-8 text-cyan-info" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Professional Tools</h3>
            <p className="text-text-secondary">
              Advanced charting, order types, and analytics designed for professional traders.
            </p>
          </Card>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card hover={false} className="bg-gradient-to-br from-blue-primary/10 to-transparent border-blue-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-primary" />
              <h3 className="text-xl font-semibold">Secure & Transparent</h3>
            </div>
            <p className="text-text-secondary mb-4">
              All transactions are protected by our MEV-resistant infrastructure. Your funds remain secure in your wallet until execution.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-light">
              <Activity className="w-4 h-4" />
              <span>Real-time protection monitoring</span>
            </div>
          </Card>

          <Card hover={false} className="bg-gradient-to-br from-green-profit/10 to-transparent border-green-profit/30">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-green-profit" />
              <h3 className="text-xl font-semibold">Community Driven</h3>
            </div>
            <p className="text-text-secondary mb-4">
              Join thousands of traders who trust ArmaDEX. Earn rewards through staking and participate in governance.
            </p>
            <div className="flex items-center gap-2 text-sm text-green-profit">
              <Activity className="w-4 h-4" />
              <span>Active community governance</span>
            </div>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join the future of MEV-protected trading. Connect your wallet and start trading in seconds.
          </p>
          <Button onClick={onStartTrading} size="large">
            Launch Trading Platform
          </Button>
        </div>
      </div>

      <footer className="border-t border-medium-gray mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-primary" />
              <span className="text-lg font-semibold">ArmaDEX</span>
            </div>
            <div className="text-sm text-text-muted">
              Protected by advanced MEV detection algorithms
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
