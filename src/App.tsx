import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { RealWeb3Provider, useWeb3 } from './providers/RealWeb3Provider';
import { WalletConnectModal } from './components/WalletConnectModal';
import { WalletConnectionDebug } from './components/WalletConnectionDebug';

function AppContent() {
  const { isConnected, connect, connectWithProvider, disconnect } = useWeb3();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = async () => {
    setIsModalOpen(true);
  };

  const handleModalConnect = async (address: string, provider: any) => {
    try {
      console.log('handleModalConnect called with:', { address, provider: !!provider });
      await connectWithProvider(address, provider);
      console.log('Wallet connected successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="min-h-screen bg-black">
      {!isConnected ? (
        <LandingPage onStartTrading={handleConnect} />
      ) : (
        <Dashboard onDisconnect={handleDisconnect} />
      )}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleModalConnect}
      />
      <WalletConnectionDebug />
    </div>
  );
}

function App() {
  // Add error boundary
  try {
    return (
      <RealWeb3Provider>
        <AppContent />
      </RealWeb3Provider>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error loading app</h1>
        <p>{String(error)}</p>
        <p>Check console for details</p>
      </div>
    );
  }
}

export default App;
