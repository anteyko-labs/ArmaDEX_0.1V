import React from 'react';

export const DebugInfo: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>✅ React is working!</h1>
      <p>If you see this, the app is loading correctly.</p>
      <div style={{ marginTop: '20px', padding: '10px', background: '#2a2a2a', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <ul>
          <li>React: {React.version}</li>
          <li>Window: {typeof window !== 'undefined' ? 'Available' : 'Not available'}</li>
          <li>MetaMask: {typeof window !== 'undefined' && window.ethereum ? 'Detected' : 'Not detected'}</li>
        </ul>
      </div>
    </div>
  );
};

