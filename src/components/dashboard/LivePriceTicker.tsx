import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchlistSettings } from './WatchlistSettings';
import { Card } from '@/components/ui/card';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  lastUpdated: Date;
}

export const LivePriceTicker = () => {
  const { subscribeToSymbol, isConnected } = useRealTimePrices();
  const { watchlist, isLoading: isLoadingWatchlist } = useWatchlist();
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());

  // Get symbols from user's watchlist - memoized to prevent unnecessary re-renders
  const trackedSymbols = useMemo(() => watchlist.map(item => item.symbol), [watchlist]);

  useEffect(() => {
    if (trackedSymbols.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    trackedSymbols.forEach((symbol) => {
      const unsubscribe = subscribeToSymbol(symbol, (priceData: PriceData) => {
        setPrices((prev) => {
          const newPrices = new Map(prev);
          newPrices.set(symbol, priceData);
          return newPrices;
        });
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribeToSymbol, trackedSymbols]);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.startsWith('BTC')) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const priceArray = Array.from(prices.entries());

  if (isLoadingWatchlist) {
    return (
      <Card className="relative overflow-hidden bg-card border-border">
        <div className="flex items-center justify-center h-16 text-muted-foreground">
          Loading watchlist...
        </div>
      </Card>
    );
  }

  if (trackedSymbols.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-card border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground">
            No cryptocurrencies in your watchlist. Add some to see live prices.
          </span>
          <WatchlistSettings />
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-card border-border">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-muted-foreground">
            {isConnected ? 'Live Market Data' : 'Connecting...'}
          </span>
        </div>
        <WatchlistSettings />
      </div>
      
      <div className="relative h-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center animate-ticker">
          {priceArray.concat(priceArray).map(([symbol, data], index) => (
            <div
              key={`${symbol}-${index}`}
              className="flex items-center gap-3 px-6 py-2 border-r border-border/50 whitespace-nowrap"
            >
              <span className="font-semibold text-foreground text-sm">
                {symbol.replace('/USDT', '')}
              </span>
              <span className="font-mono text-sm text-foreground">
                ${formatPrice(data.price, symbol)}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.change24h >= 0
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {data.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(data.change24h).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
