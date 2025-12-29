
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  lastUpdated: Date;
}

interface PriceMonitorProps {
  symbols?: string[];
  compact?: boolean;
}

const PriceMonitor = ({ symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'], compact = false }: PriceMonitorProps) => {
  const { subscribeToSymbol, isConnected } = useRealTimePrices();
  const [watchedPrices, setWatchedPrices] = useState<{[symbol: string]: PriceData}>({});

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    symbols.forEach(symbol => {
      const unsubscribe = subscribeToSymbol(symbol, (priceData) => {
        setWatchedPrices(prev => ({
          ...prev,
          [symbol]: priceData
        }));
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [symbols, subscribeToSymbol]);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (price < 1) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    }
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium">الأسعار المباشرة</h3>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
        </div>
        
        <div className="grid gap-2">
          {symbols.map(symbol => {
            const priceData = watchedPrices[symbol];
            const shortSymbol = symbol.split('/')[0];
            
            return (
              <div key={symbol} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{shortSymbol}</span>
                  {priceData?.change24h !== undefined && (
                    <>
                      {priceData.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                    </>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold">
                    ${priceData ? formatPrice(priceData.price, symbol) : '...'}
                  </div>
                  {priceData?.change24h !== undefined && (
                    <div className={`text-xs ${priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">مراقب الأسعار المباشر</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <Badge variant="outline" className="text-green-600 border-green-600">
                  متصل
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <Badge variant="outline" className="text-red-600 border-red-600">
                  غير متصل
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-4">
          {symbols.map(symbol => {
            const priceData = watchedPrices[symbol];
            const shortSymbol = symbol.split('/')[0];
            
            return (
              <div key={symbol} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {shortSymbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{symbol}</div>
                    <div className="text-sm text-gray-500">
                      حجم: {priceData ? formatVolume(priceData.volume) : '...'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ${priceData ? formatPrice(priceData.price, symbol) : '...'}
                  </div>
                  {priceData?.change24h !== undefined && (
                    <div className="flex items-center gap-1 justify-end">
                      {priceData.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {priceData?.lastUpdated && (
                    <div className="text-xs text-gray-400 mt-1">
                      آخر تحديث: {priceData.lastUpdated.toLocaleTimeString('ar', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceMonitor;
