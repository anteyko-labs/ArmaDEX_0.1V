import React, { useState, useEffect, useRef } from 'react';
import { X, Wallet, QrCode, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, provider: any) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [connectionMethod, setConnectionMethod] = useState<'metamask' | 'qr' | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnectProvider, setWalletConnectProvider] = useState<InstanceType<typeof EthereumProvider> | null>(null);
  const qrUriRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConnectionMethod(null);
      setQrUri(null);
      qrUriRef.current = null;
      setIsConnecting(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (walletConnectProvider) {
        walletConnectProvider.disconnect().catch(console.error);
        setWalletConnectProvider(null);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, walletConnectProvider]);

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true);
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        setIsConnecting(false);
        return;
      }

      console.log('Requesting MetaMask accounts...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('MetaMask accounts received:', accounts);
      if (accounts && accounts.length > 0) {
        console.log('Connecting with address:', accounts[0]);
        await onConnect(accounts[0], window.ethereum);
        onClose();
      } else {
        alert('No accounts found. Please unlock your MetaMask wallet.');
      }
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error);
      if (error.code === 4001) {
        alert('Connection rejected. Please approve the connection request in MetaMask.');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check MetaMask.');
      } else {
        alert(`Failed to connect MetaMask: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletConnect = async () => {
    try {
      setIsConnecting(true);
      setQrUri(null); // Reset QR code
      
      // Get project ID from env or use fallback
      const envProjectId = import.meta.env.VITE_WC_PROJECT_ID;
      const projectId = envProjectId && envProjectId !== 'your_walletconnect_project_id_here' 
        ? envProjectId 
        : 'bae1988f9fff8e3b8086760a5f45a362';
      
      console.log('Initializing WalletConnect provider...');
      console.log('Project ID from env:', envProjectId ? 'Found' : 'Not found');
      console.log('Using Project ID:', projectId);
      
      // Validate project ID format
      if (!projectId || projectId.length < 20 || projectId.includes('your_walletconnect')) {
        throw new Error('Invalid WalletConnect Project ID. Please check your .env file and restart the dev server.');
      }
      
      // Initialize provider with error handling
      let provider: InstanceType<typeof EthereumProvider>;
      try {
        provider = await EthereumProvider.init({
          projectId: projectId,
          chains: [11155111], // Sepolia chain ID
          showQrModal: false, // We'll show our own QR code
          metadata: {
            name: 'ArmaDEX',
            description: 'MEV-Protected Trading Platform',
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.ico`],
          },
        });
      } catch (initError) {
        console.error('Provider initialization error:', initError);
        throw new Error(`Failed to initialize WalletConnect: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }

      setWalletConnectProvider(provider);
      console.log('Provider initialized, setting up event listeners...');

      // Set up event listeners BEFORE calling enable()
      provider.on('display_uri', (uri: string) => {
        console.log('QR URI received:', uri);
        qrUriRef.current = uri;
        setQrUri(uri);
        setIsConnecting(false); // QR is ready, stop loading
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });

      provider.on('connect', async () => {
        console.log('WalletConnect connected');
        if (provider.accounts && provider.accounts.length > 0) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsConnecting(false);
          onConnect(provider.accounts[0], provider);
          onClose();
        }
      });

      provider.on('disconnect', () => {
        console.log('WalletConnect disconnected');
        setQrUri(null);
        setWalletConnectProvider(null);
      });

      provider.on('session_event', (event: any) => {
        console.log('Session event:', event);
      });

      provider.on('session_delete', () => {
        console.log('Session deleted');
        setQrUri(null);
        setWalletConnectProvider(null);
      });

      // Set a timeout to show error if QR doesn't appear
      timeoutRef.current = setTimeout(() => {
        if (!qrUriRef.current) {
          console.error('QR code generation timeout');
          alert('QR code generation is taking too long. Please check your WalletConnect Project ID and try again.');
          setIsConnecting(false);
          if (provider) {
            provider.disconnect().catch(console.error);
          }
        }
      }, 15000); // 15 seconds timeout

      // Call enable() which will trigger display_uri event
      console.log('Calling provider.enable()...');
      await provider.enable();

      // Wait for connection (enable() might already have connected)
      if (provider.accounts && provider.accounts.length > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        onConnect(provider.accounts[0], provider);
        onClose();
      }
    } catch (error) {
      console.error('Failed to connect via WalletConnect:', error);
      setIsConnecting(false);
      setQrUri(null);
      
      if (walletConnectProvider) {
        try {
          await walletConnectProvider.disconnect();
        } catch (e) {
          console.error('Error disconnecting provider:', e);
        }
        setWalletConnectProvider(null);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('user rejected') || errorMessage.includes('rejected')) {
          alert('Connection cancelled by user.');
        } else if (errorMessage.includes('projectid') || errorMessage.includes('project id')) {
          alert('Invalid WalletConnect Project ID. Please check your .env file and restart the server.');
        } else if (errorMessage.includes('publish') || errorMessage.includes('payload')) {
          alert('Network error: Unable to connect to WalletConnect servers. Please check your internet connection and try again.');
        } else if (errorMessage.includes('timeout')) {
          alert('Connection timeout. Please try again.');
        } else {
          // Show user-friendly error
          const friendlyMessage = errorMessage.includes('failed') 
            ? 'Connection failed. Please check your internet connection and try again.'
            : `Connection error: ${error.message}`;
          alert(friendlyMessage);
        }
      } else {
        alert('Failed to connect via WalletConnect. Please check your internet connection and try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-dark-gray border border-medium-gray rounded-lg p-6 max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Connect Wallet</h2>

        {!connectionMethod ? (
          <div className="space-y-4">
            <button
              onClick={() => setConnectionMethod('metamask')}
              className="w-full p-4 bg-medium-gray hover:bg-blue-primary/20 border border-medium-gray hover:border-blue-primary rounded-lg transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">MetaMask</div>
                <div className="text-sm text-text-secondary">Connect using MetaMask extension</div>
              </div>
            </button>

            <button
              onClick={async () => {
                setConnectionMethod('qr');
                // Start WalletConnect initialization immediately when QR option is selected
                setTimeout(() => {
                  connectWalletConnect();
                }, 100);
              }}
              className="w-full p-4 bg-medium-gray hover:bg-blue-primary/20 border border-medium-gray hover:border-blue-primary rounded-lg transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-primary/10 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-blue-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">WalletConnect</div>
                <div className="text-sm text-text-secondary">Scan QR code with mobile wallet</div>
              </div>
            </button>
          </div>
        ) : connectionMethod === 'metamask' ? (
          <div className="space-y-4">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-blue-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect MetaMask</h3>
              <p className="text-text-secondary mb-6">
                Click the button below to connect your MetaMask wallet
              </p>
              <button
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="w-full py-3 bg-blue-primary hover:bg-blue-primary/80 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
              <button
                onClick={() => setConnectionMethod(null)}
                className="w-full mt-2 py-2 text-text-secondary hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-blue-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scan QR Code</h3>
              <p className="text-text-secondary mb-6">
                Open your mobile wallet and scan this QR code to connect
              </p>
              
              {qrUri ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCodeSVG value={qrUri} size={256} />
                  </div>
                  <p className="text-sm text-text-secondary">
                    Scan this QR code with your mobile wallet app (MetaMask, Trust Wallet, etc.)
                  </p>
                  {isConnecting && (
                    <div className="flex items-center justify-center gap-2 text-blue-primary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-primary"></div>
                      <span className="text-sm">Waiting for connection...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-medium-gray p-16 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary mb-2">Generating QR code...</p>
                    <p className="text-xs text-text-muted">
                      {isConnecting ? 'Initializing WalletConnect...' : 'Click button to start'}
                    </p>
                  </div>
                </div>
              )}

              {!qrUri && (
                <button
                  onClick={connectWalletConnect}
                  disabled={isConnecting}
                  className="w-full py-3 bg-blue-primary hover:bg-blue-primary/80 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? 'Generating QR Code...' : 'Generate QR Code'}
                </button>
              )}
              <button
                onClick={() => {
                  setConnectionMethod(null);
                  if (walletConnectProvider) {
                    walletConnectProvider.disconnect();
                    setWalletConnectProvider(null);
                  }
                }}
                className="w-full mt-2 py-2 text-text-secondary hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

