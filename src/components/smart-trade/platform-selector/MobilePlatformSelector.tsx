
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Activity } from 'lucide-react';
import PlatformSelect from './PlatformSelect';
import MarketTypeSelect from './MarketTypeSelect';
import TradingPairSection from './TradingPairSection';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface PlatformInfo {
  platform: string;
  testnet: boolean;
}

interface MobilePlatformSelectorProps {
  selectedPlatform: string;
  selectedSymbol: string;
  marketType: 'spot' | 'futures';
  availableApiKeys: ApiKey[];
  pairs: string[];
  marketPrices: Array<{
    symbol: string;
    price: number;
    change24h: number;
  }>;
  pairsLoading: boolean;
  selectedPlatformInfo: PlatformInfo | null;
  onPlatformChange: (platformId: string) => void;
  onSymbolChange: (symbol: string) => void;
  onMarketTypeChange: (value: 'spot' | 'futures') => void;
  onRefreshPairs: () => void;
  getPlatformDisplayName: (platform: string, testnet: boolean) => string;
}

const MobilePlatformSelector = ({
  selectedPlatform,
  selectedSymbol,
  marketType,
  availableApiKeys,
  pairs,
  marketPrices,
  pairsLoading,
  selectedPlatformInfo,
  onPlatformChange,
  onSymbolChange,
  onMarketTypeChange,
  onRefreshPairs,
  getPlatformDisplayName
}: MobilePlatformSelectorProps) => {
  return (
    <Card className="mb-4 trading-card animate-fade-in-scale">
      <CardContent className="p-3 space-y-3">
        {/* عنوان البلوك مع أيقونة تفاعلية */}
        <div className="text-center pb-2 border-b border-border">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <Settings className="w-4 h-4 icon-interactive icon-glow" />
            <h3 className="text-sm font-semibold text-foreground">
              إعدادات التداول
            </h3>
          </div>
        </div>

        {/* اختيار المنصة */}
        <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          <label className="block text-xs font-medium text-muted-foreground">
            المنصة
          </label>
          <PlatformSelect
            selectedPlatform={selectedPlatform}
            availableApiKeys={availableApiKeys}
            onPlatformChange={onPlatformChange}
            getPlatformDisplayName={getPlatformDisplayName}
          />
        </div>

        {/* نوع السوق */}
        <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
          <label className="block text-xs font-medium text-muted-foreground">
            نوع السوق
          </label>
          <MarketTypeSelect
            marketType={marketType}
            onMarketTypeChange={onMarketTypeChange}
          />
        </div>

        {/* اختيار زوج العملة */}
        <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              زوج العملة
            </label>
          </div>
          
          <TradingPairSection
            pairs={pairs}
            selectedSymbol={selectedSymbol}
            marketPrices={marketPrices}
            pairsLoading={pairsLoading}
            selectedPlatform={selectedPlatform}
            onSymbolChange={onSymbolChange}
            onRefreshPairs={onRefreshPairs}
          />
        </div>

        {/* معلومات الحالة */}
        {selectedPlatform && (
          <div className="mt-3 pt-3 border-t border-border animate-float-up" style={{ animationDelay: '0.4s' }}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block">الحالة:</span>
                {selectedPlatformInfo ? (
                  <Badge variant="default" className="text-xs status-success">
                    <Activity className="w-2 h-2 mr-1 icon-interactive" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    غير محدد
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <span className="text-muted-foreground block">الأزواج:</span>
                <span className="text-foreground font-medium">
                  {pairsLoading ? '...' : pairs.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mt-2">
              <div className="space-y-1">
                <span className="text-muted-foreground block">النوع:</span>
                <span className="text-foreground font-medium">
                  {marketType === 'spot' ? 'عادي' : 'مستقبليات'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground block">الزوج:</span>
                {selectedSymbol && (
                  <Badge variant="secondary" className="text-xs status-info">
                    {selectedSymbol}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobilePlatformSelector;
