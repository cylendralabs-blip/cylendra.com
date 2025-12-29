
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp } from 'lucide-react';

interface MarketTypeSelectProps {
  marketType: 'spot' | 'futures';
  onMarketTypeChange: (value: 'spot' | 'futures') => void;
}

const MarketTypeSelect = ({ marketType, onMarketTypeChange }: MarketTypeSelectProps) => {
  return (
    <Select value={marketType} onValueChange={onMarketTypeChange}>
      <SelectTrigger className="w-full trading-input focus-ring">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border-border shadow-trading-lg">
        <SelectItem value="spot" className="transition-smooth hover:bg-secondary/50">
          <div className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4 icon-interactive" />
            <span>Spot (العادي)</span>
          </div>
        </SelectItem>
        <SelectItem value="futures" className="transition-smooth hover:bg-secondary/50">
          <div className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-4 h-4 icon-interactive" />
            <span>Futures (المستقبليات)</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default MarketTypeSelect;
