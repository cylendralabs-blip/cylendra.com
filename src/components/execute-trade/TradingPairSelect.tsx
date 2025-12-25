
import { useState, useMemo } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface TradingPairSelectProps {
  pairs: string[];
  selectedPair: string;
  marketPrices: MarketPrice[];
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  onPairChange: (pair: string) => void;
}

const TradingPairSelect = ({
  pairs,
  selectedPair,
  marketPrices,
  loading,
  disabled,
  placeholder,
  onPairChange,
}: TradingPairSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const getMarketPrice = (pair: string) => {
    return marketPrices.find(p => p.symbol === pair);
  };

  // فلترة الأزواج حسب البحث
  const filteredPairs = useMemo(() => {
    if (!searchTerm) return pairs;
    return pairs.filter(pair => 
      pair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pairs, searchTerm]);

  // ترتيب الأزواج حسب الحجم والشعبية
  const sortedPairs = useMemo(() => {
    return [...filteredPairs].sort((a, b) => {
      // الأزواج الرئيسية أولاً
      const mainPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];
      const aIsMain = mainPairs.includes(a);
      const bIsMain = mainPairs.includes(b);
      
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      
      // ثم ترتيب أبجدي
      return a.localeCompare(b);
    });
  }, [filteredPairs]);

  const handlePairSelect = (pair: string) => {
    onPairChange(pair);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
          disabled={disabled}
        >
          {selectedPair || placeholder}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardContent className="p-3">
            {/* شريط البحث */}
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن زوج العملة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* قائمة الأزواج */}
            <ScrollArea className="h-64">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="mr-2">جاري تحميل الأزواج...</span>
                </div>
              ) : sortedPairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أزواج متاحة'}
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedPairs.map((pair) => {
                    const marketPrice = getMarketPrice(pair);
                    const isSelected = selectedPair === pair;
                    
                    return (
                      <div
                        key={pair}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors
                          ${isSelected 
                            ? 'bg-accent text-accent-foreground' 
                            : 'hover:bg-accent/50'
                          }`}
                        onClick={() => handlePairSelect(pair)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{pair}</span>
                          {marketPrice && (
                            <span className="text-xs text-muted-foreground">
                              ${marketPrice.price.toFixed(marketPrice.price < 1 ? 6 : 2)}
                            </span>
                          )}
                        </div>
                        
                        {marketPrice && (
                          <Badge 
                            variant={marketPrice.change24h >= 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {marketPrice.change24h >= 0 ? '+' : ''}
                            {marketPrice.change24h.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* معلومات إضافية */}
            {!loading && pairs.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  {searchTerm 
                    ? `${filteredPairs.length} من ${pairs.length} زوج`
                    : `${pairs.length} زوج متاح`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TradingPairSelect;
