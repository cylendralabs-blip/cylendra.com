
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { useTradingPairs } from '@/hooks/useTradingPairs';
import TradingPairSelect from './TradingPairSelect';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface TradeSettingsFormProps {
  apiKeys: ApiKey[];
  marketPrices: MarketPrice[];
  selectedPlatform: string;
  selectedPair: string;
  marketType: 'spot' | 'futures';
  orderType: 'market' | 'limit';
  tradeDirection: 'long' | 'short';
  currentPrice: number;
  limitPrice: number;
  lossPctFromEntry: number;
  autoExecute: boolean;
  onPlatformChange: (value: string) => void;
  onPairChange: (value: string) => void;
  onMarketTypeChange: (value: string) => void;
  onOrderTypeChange: (value: string) => void;
  onTradeDirectionChange: (value: string) => void;
  onCurrentPriceChange: (value: number) => void;
  onLimitPriceChange: (value: number) => void;
  onLossPercentageChange: (value: number) => void;
  onAutoExecuteChange: (value: boolean) => void;
}

const TradeSettingsForm = ({
  apiKeys,
  marketPrices,
  selectedPlatform,
  selectedPair,
  marketType,
  orderType,
  tradeDirection,
  currentPrice,
  limitPrice,
  lossPctFromEntry,
  autoExecute,
  onPlatformChange,
  onPairChange,
  onMarketTypeChange,
  onOrderTypeChange,
  onTradeDirectionChange,
  onCurrentPriceChange,
  onLimitPriceChange,
  onLossPercentageChange,
  onAutoExecuteChange,
}: TradeSettingsFormProps) => {
  
  // جلب الأزواج المتاحة حسب المنصة المختارة
  const { pairs: availablePairs, loading: pairsLoading, refetch: refetchPairs } = useTradingPairs({
    platformId: selectedPlatform,
    marketType
  });

  const getPlatformDisplayName = (platform: string, testnet: boolean) => {
    const platformNames: {[key: string]: string} = {
      'binance': 'Binance',
      'binance-futures-testnet': 'Binance Futures Testnet',
      'okx': 'OKX',
      'bybit': 'Bybit',
      'kucoin': 'KuCoin'
    };
    
    return platformNames[platform] || platform.toUpperCase() + (testnet ? ' (تجريبي)' : '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات الصفقة</CardTitle>
        <CardDescription>أدخل بيانات الصفقة الأساسية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* اختيار المنصة */}
        <div className="space-y-2">
          <label className="text-sm font-medium">المنصة</label>
          <Select value={selectedPlatform} onValueChange={onPlatformChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المنصة" />
            </SelectTrigger>
            <SelectContent>
              {apiKeys.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {getPlatformDisplayName(key.platform, key.testnet)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* نوع السوق */}
        <div className="space-y-2">
          <label className="text-sm font-medium">نوع السوق</label>
          <Select value={marketType} onValueChange={onMarketTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot (العادي)</SelectItem>
              <SelectItem value="futures">Futures (المستقبليات)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* اتجاه التداول - يظهر فقط في الفيوتشرز */}
        {marketType === 'futures' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">اتجاه التداول</label>
            <Select value={tradeDirection} onValueChange={onTradeDirectionChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    لونغ (Long) - شراء
                  </div>
                </SelectItem>
                <SelectItem value="short">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    شورت (Short) - بيع
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {tradeDirection === 'long' 
                ? 'توقع ارتفاع السعر - سيتم الشراء أولاً ثم البيع عند الربح' 
                : 'توقع انخفاض السعر - سيتم البيع أولاً ثم الشراء عند الربح'
              }
            </p>
          </div>
        )}

        {/* نوع الدخول */}
        <div className="space-y-2">
          <label className="text-sm font-medium">نوع الدخول</label>
          <Select value={orderType} onValueChange={onOrderTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">سوق (Market Order)</SelectItem>
              <SelectItem value="limit">محدود (Limit Order)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {orderType === 'market' 
              ? 'تنفيذ فوري بأفضل سعر متاح' 
              : 'تنفيذ عند السعر المحدد فقط'
            }
          </p>
        </div>

        {/* اختيار زوج العملة المحدث */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">زوج العملة</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetchPairs}
              disabled={pairsLoading || !selectedPlatform}
              className="h-6 px-2"
            >
              {pairsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
          
          <TradingPairSelect
            pairs={availablePairs}
            selectedPair={selectedPair}
            marketPrices={marketPrices}
            loading={pairsLoading}
            disabled={!selectedPlatform}
            placeholder={
              !selectedPlatform 
                ? "اختر المنصة أولاً" 
                : pairsLoading 
                  ? "جاري تحميل الأزواج..." 
                  : "ابحث عن زوج العملة أو اختر من القائمة"
            }
            onPairChange={onPairChange}
          />
          
          {selectedPlatform && !pairsLoading && availablePairs.length === 0 && (
            <p className="text-xs text-gray-500">
              لا توجد أزواج متاحة لهذه المنصة أو نوع السوق
            </p>
          )}
          
          {selectedPlatform && availablePairs.length > 0 && (
            <p className="text-xs text-green-600">
              تم تحميل {availablePairs.length} زوج من المنصة المختارة
            </p>
          )}
        </div>

        {/* السعر الحالي */}
        <div className="space-y-2">
          <label className="text-sm font-medium">السعر الحالي (USDT)</label>
          <Input
            type="number"
            value={currentPrice || ''}
            onChange={(e) => onCurrentPriceChange(Number(e.target.value))}
            placeholder="يتم جلبه تلقائياً"
            step="0.00001"
            disabled={orderType === 'market'}
          />
          {currentPrice > 0 && (
            <p className="text-xs text-green-600">السعر الحالي: ${currentPrice.toFixed(4)}</p>
          )}
        </div>

        {/* السعر المحدود */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">السعر المحدود (USDT)</label>
            <Input
              type="number"
              value={limitPrice || ''}
              onChange={(e) => onLimitPriceChange(Number(e.target.value))}
              placeholder="أدخل السعر المرغوب"
              step="0.00001"
            />
            <p className="text-xs text-gray-500">
              سيتم تنفيذ الصفقة عند هذا السعر فقط
            </p>
          </div>
        )}

        {/* نسبة الخسارة من سعر الدخول */}
        <div className="space-y-2">
          <label className="text-sm font-medium">نسبة الخسارة من سعر الدخول (%)</label>
          <Input
            type="number"
            value={lossPctFromEntry}
            onChange={(e) => onLossPercentageChange(Number(e.target.value))}
            placeholder="مثال: 5"
            min="0.1"
            max="20"
            step="0.1"
          />
        </div>

        {/* التنفيذ التلقائي */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">التنفيذ التلقائي</label>
          <Switch checked={autoExecute} onCheckedChange={onAutoExecuteChange} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSettingsForm;
