import React, { useEffect, useRef, useState } from 'react';
import { createTradingViewConfig } from '../services/tradingViewService';

interface AdvancedTradingViewWidgetProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  studies?: string[];
  className?: string;
  showToolbar?: boolean;
  showSidebar?: boolean;
  enableDrawing?: boolean;
  enableScreenshot?: boolean;
  enableVolume?: boolean;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const AdvancedTradingViewWidget: React.FC<AdvancedTradingViewWidgetProps> = ({
  symbol,
  interval = '1',
  theme = 'dark',
  height = 610,
  width = 980,
  studies = [],
  className = '',
  showToolbar = true,
  showSidebar = true,
  enableDrawing = true,
  enableScreenshot = true,
  enableVolume = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeInterval, setActiveInterval] = useState(interval);

  // Advanced studies for professional trading
  const defaultStudies = [
    'Volume@tv-basicstudies',
    'RSI@tv-basicstudies',
    'MACD@tv-basicstudies',
    'MA@tv-basicstudies',
    'EMA@tv-basicstudies',
    'BB@tv-basicstudies',
    'Stochastic@tv-basicstudies',
    'Williams%R@tv-basicstudies',
    'ATR@tv-basicstudies',
    'ADX@tv-basicstudies',
    'CCI@tv-basicstudies',
    'Ichimoku@tv-basicstudies',
    'PivotPointsStandard@tv-basicstudies',
    'VWAP@tv-basicstudies',
    'BollingerBands@tv-basicstudies',
    'ParabolicSAR@tv-basicstudies',
    'ZigZag@tv-basicstudies',
    'FibonacciRetracements@tv-basicstudies',
    'FibonacciExtensions@tv-basicstudies',
    'FibonacciArcs@tv-basicstudies',
    'FibonacciFan@tv-basicstudies',
    'FibonacciTimeZones@tv-basicstudies'
  ];

  useEffect(() => {
    const loadTradingViewScript = () => {
      return new Promise((resolve, reject) => {
        if (window.TradingView) {
          resolve(window.TradingView);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve(window.TradingView);
        script.onerror = () => reject(new Error('Failed to load TradingView script'));
        document.head.appendChild(script);
      });
    };

    const createWidget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadTradingViewScript();

        if (!containerRef.current) {
          throw new Error('Container not found');
        }

        // Clean up existing widget
        if (widgetRef.current) {
          widgetRef.current.remove();
        }

        const config = createTradingViewConfig(symbol, containerRef.current.id, {
          width,
          height,
          interval: activeInterval,
          theme,
          studies: studies.length > 0 ? studies : defaultStudies,
          enable_publishing: false,
          hide_side_toolbar: !showSidebar,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: true,
          // @ts-ignore - TradingView widget config
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          show_volume: enableVolume,
          hide_volume: !enableVolume,
          studies_overrides: {
            'volume.volume.color.0': '#00bcd4',
            'volume.volume.color.1': '#ff9800',
            'volume.volume.transparency': 70,
            'rsi.rsi.color': '#ff6b6b',
            'rsi.rsi.transparency': 70,
            'macd.macd.color': '#2196f3',
            'macd.signal.color': '#ff9800',
            'macd.histogram.color': '#4caf50'
          },
          overrides: {
            'paneProperties.background': '#1e1e1e',
            'paneProperties.vertGridProperties.color': '#2a2a2a',
            'paneProperties.horzGridProperties.color': '#2a2a2a',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#d1d4dc',
            'scalesProperties.lineColor': '#2a2a2a'
          }
        });

        widgetRef.current = new window.TradingView.widget(config);
        
        // Check if onChartReady method exists
        if (widgetRef.current && typeof widgetRef.current.onChartReady === 'function') {
          widgetRef.current.onChartReady(() => {
            setIsLoading(false);
            console.log('TradingView chart ready with advanced features');
          });
        } else {
          // Fallback: set loading to false after a delay
          setTimeout(() => {
            setIsLoading(false);
            console.log('TradingView chart loaded (fallback)');
          }, 2000);
        }

      } catch (err) {
        console.error('Error creating advanced TradingView widget:', err);
        setError('Failed to load advanced TradingView widget');
        setIsLoading(false);
      }
    };

    createWidget();

    return () => {
      if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
        try {
          widgetRef.current.remove();
        } catch (error) {
          console.warn('Error removing TradingView widget:', error);
        }
      }
    };
  }, [symbol, activeInterval, theme, height, width, studies, showToolbar, showSidebar, enableDrawing, enableScreenshot, enableVolume]);

  const intervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1d' },
    { value: 'W', label: '1w' }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Interval Selector */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-medium-gray rounded-lg">
        <span className="text-sm text-text-muted">Timeframe:</span>
        {intervals.map((interval) => (
          <button
            key={interval.value}
            onClick={() => setActiveInterval(interval.value)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeInterval === interval.value
                ? 'bg-blue-primary text-white'
                : 'bg-dark-gray text-text-muted hover:text-white hover:bg-medium-gray'
            }`}
          >
            {interval.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-gray rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
            <p className="text-text-muted">Loading Advanced TradingView...</p>
            <p className="text-xs text-text-muted mt-2">Initializing professional trading tools...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-gray rounded-lg z-10">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-primary text-white rounded hover:bg-blue-primary/80"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Chart Container */}
      <div
        id={`advanced_tradingview_${symbol}_${Date.now()}`}
        ref={containerRef}
        style={{ width: '100%', height: `${height}px` }}
        className="rounded-lg overflow-hidden"
      />

      {/* Features Info */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-profit rounded-full"></div>
          <span>22+ Indicators</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-primary rounded-full"></div>
          <span>Drawing Tools</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Volume Analysis</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span>Fibonacci Tools</span>
        </div>
      </div>
    </div>
  );
};
