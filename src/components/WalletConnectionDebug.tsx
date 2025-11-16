import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../providers/RealWeb3Provider';

export const WalletConnectionDebug: React.FC = () => {
  const { isConnected, address, balance, chainId } = useWeb3();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info: any = {
      window: typeof window !== 'undefined',
      ethereum: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
      isConnected,
      address,
      balance,
      chainId,
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      info.ethereumInfo = {
        isMetaMask: (window.ethereum as any).isMetaMask,
        selectedAddress: (window.ethereum as any).selectedAddress,
        chainId: (window.ethereum as any).chainId,
      };
    }

    setDebugInfo(info);
  }, [isConnected, address, balance, chainId]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-dark-gray border border-medium-gray rounded-lg p-4 text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2 text-white">Wallet Debug Info</h3>
      <pre className="text-text-secondary overflow-auto max-h-64">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

