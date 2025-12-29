import { useState } from 'react';
import { Settings, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
  'DOT/USDT',
  'MATIC/USDT',
  'LINK/USDT',
  'UNI/USDT',
  'ATOM/USDT',
  'LTC/USDT',
  'BCH/USDT',
  'NEAR/USDT',
  'APT/USDT',
  'ARB/USDT',
  'OP/USDT',
  'SUI/USDT',
];

export const WatchlistSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const watchlistSymbols = watchlist.map(item => item.symbol);
  const availableToAdd = AVAILABLE_SYMBOLS.filter(
    symbol => !watchlistSymbols.includes(symbol)
  );

  const handleAdd = () => {
    if (selectedSymbol) {
      addToWatchlist(selectedSymbol);
      setSelectedSymbol('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Price Ticker</DialogTitle>
          <DialogDescription>
            Select which cryptocurrencies to display in your live price ticker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new symbol */}
          <div className="flex gap-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select cryptocurrency..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAdd}
              disabled={!selectedSymbol}
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Current watchlist */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Your Watchlist ({watchlist.length})
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cryptocurrencies in your watchlist
                </div>
              ) : (
                watchlist.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Badge variant="outline" className="font-mono">
                      {item.symbol}
                    </Badge>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
