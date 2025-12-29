
import { Card, CardContent } from '@/components/ui/card';
import PlatformSelect from './PlatformSelect';
import MarketTypeSelect from './MarketTypeSelect';
import TradingPairSection from './TradingPairSection';
import PlatformStatusInfo from './PlatformStatusInfo';

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

interface DesktopPlatformSelectorProps {
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

const DesktopPlatformSelector = ({
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
}: DesktopPlatformSelectorProps) => {
  return (
    <Card className="mb-4 trading-card card-hover animate-fade-in-scale">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* اختيار المنصة */}
          <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm font-medium text-muted-foreground">
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
            <label className="text-sm font-medium text-muted-foreground">
              نوع السوق
            </label>
            <MarketTypeSelect
              marketType={marketType}
              onMarketTypeChange={onMarketTypeChange}
            />
          </div>

          {/* اختيار زوج العملة */}
          <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
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

          {/* معلومات المنصة */}
          <PlatformStatusInfo
            selectedPlatformInfo={selectedPlatformInfo}
            getPlatformDisplayName={getPlatformDisplayName}
            pairsLoading={pairsLoading}
            pairsCount={pairs.length}
            marketType={marketType}
            selectedSymbol={selectedSymbol}
          />
        </div>

        {/* معلومات إضافية */}
        {selectedPlatform && (
          <div className="mt-4 pt-4 border-t border-border animate-float-up" style={{ animationDelay: '0.5s' }}>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">الأزواج المتاحة:</span>
                <span className="text-foreground mr-2 font-medium">
                  {pairsLoading ? '...' : pairs.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">النوع:</span>
                <span className="text-foreground mr-2 font-medium">
                  {marketType === 'spot' ? 'عادي' : 'مستقبليات'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">الزوج المختار:</span>
                <span className="text-primary-600 font-medium mr-2">
                  {selectedSymbol || 'غير محدد'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesktopPlatformSelector;
