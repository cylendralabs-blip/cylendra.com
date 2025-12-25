
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import TradingPairSelect from '@/components/execute-trade/TradingPairSelect';

interface TradingPairSectionProps {
  pairs: string[];
  selectedSymbol: string;
  marketPrices: Array<{
    symbol: string;
    price: number;
    change24h: number;
  }>;
  pairsLoading: boolean;
  selectedPlatform: string;
  onSymbolChange: (symbol: string) => void;
  onRefreshPairs: () => void;
}

const TradingPairSection = ({
  pairs,
  selectedSymbol,
  marketPrices,
  pairsLoading,
  selectedPlatform,
  onSymbolChange,
  onRefreshPairs
}: TradingPairSectionProps) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          زوج العملة
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshPairs}
          disabled={pairsLoading || !selectedPlatform}
          className="h-6 px-2 trading-button hover:bg-secondary/50"
        >
          {pairsLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 icon-interactive icon-bounce" />
          )}
        </Button>
      </div>
      
      <TradingPairSelect
        pairs={pairs}
        selectedPair={selectedSymbol}
        marketPrices={marketPrices}
        loading={pairsLoading}
        disabled={!selectedPlatform}
        placeholder={
          !selectedPlatform 
            ? "اختر المنصة أولاً" 
            : pairsLoading 
              ? "جاري تحميل الأزواج..." 
              : "اختر زوج العملة"
        }
        onPairChange={onSymbolChange}
      />
    </>
  );
};

export default TradingPairSection;
