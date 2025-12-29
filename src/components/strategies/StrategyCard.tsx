
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Settings, BarChart3, Trash2, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStrategyTemplates } from '@/hooks/useStrategyTemplates';
import { useStrategyTrades } from '@/hooks/useStrategyTrades';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';

interface StrategyCardProps {
  strategy: {
    id: string;
    name: string;
    type: string;
    description: string;
    is_active: boolean;
    settings: any;
    performance_data: any;
  };
}

const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(strategy.settings);
  const [currentPrices, setCurrentPrices] = useState<{[symbol: string]: number}>({});
  
  const { updateStrategy, deleteStrategy } = useStrategyTemplates();
  const { trades } = useStrategyTrades(strategy.id);
  const { subscribeToSymbol } = useRealTimePrices();

  // مراقبة الأسعار للعملات المستخدمة في الاستراتيجية
  useEffect(() => {
    const symbolsToWatch = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']; // يمكن تخصيصها حسب الاستراتيجية
    const unsubscribers: (() => void)[] = [];

    symbolsToWatch.forEach(symbol => {
      const unsubscribe = subscribeToSymbol(symbol, (priceData) => {
        setCurrentPrices(prev => ({
          ...prev,
          [symbol]: priceData.price
        }));
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribeToSymbol]);

  const handleToggleActive = async () => {
    await updateStrategy.mutateAsync();
  };

  const handleUpdateSettings = async () => {
    await updateStrategy.mutateAsync();
    setIsSettingsOpen(false);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذه الاستراتيجية؟')) {
      await deleteStrategy.mutateAsync();
    }
  };

  const activeTrades = trades.filter(trade => trade.status === 'ACTIVE').length;
  const totalProfit = trades
    .filter(trade => trade.status === 'CLOSED')
    .reduce((sum, trade) => sum + trade.realized_pnl, 0);

  const getRiskLevel = () => {
    if (strategy.type === 'dca_basic') return 'منخفض';
    if (strategy.type.includes('leverage')) return 'متوسط';
    return 'عالي';
  };

  const getRiskColor = () => {
    const risk = getRiskLevel();
    if (risk === 'منخفض') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (risk === 'متوسط') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // حساب الأداء المباشر
  const calculateUnrealizedPnl = () => {
    return trades
      .filter(trade => trade.status === 'ACTIVE')
      .reduce((sum, trade) => {
        const currentPrice = currentPrices[trade.symbol] || trade.current_price || trade.entry_price;
        const priceDiff = currentPrice - trade.entry_price;
        const pnl = trade.side === 'BUY' ? priceDiff * trade.quantity : -priceDiff * trade.quantity;
        return sum + pnl;
      }, 0);
  };

  const unrealizedPnl = calculateUnrealizedPnl();

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{strategy.name}</CardTitle>
            <Badge className={getRiskColor()}>
              {getRiskLevel()}
            </Badge>
            {strategy.is_active && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="w-3 h-3 mr-1" />
                نشط
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={strategy.is_active}
              onCheckedChange={handleToggleActive}
              disabled={updateStrategy.isPending}
            />
            {strategy.is_active ? (
              <Play className="w-4 h-4 text-green-500" />
            ) : (
              <Pause className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        <CardDescription>{strategy.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* إحصائيات الاستراتيجية */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeTrades}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">صفقات نشطة</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}$
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">ربح محقق</div>
          </div>
        </div>

        {/* الربح/الخسارة غير المحققة */}
        {activeTrades > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">الربح/الخسارة المباشر:</span>
              <div className="flex items-center gap-1">
                {unrealizedPnl >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`font-bold ${unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}$
                </span>
              </div>
            </div>
          </div>
        )}

        {/* عرض الأسعار المباشرة للعملات المتداولة */}
        {strategy.is_active && Object.keys(currentPrices).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">الأسعار المباشرة:</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(currentPrices).slice(0, 4).map(([symbol, price]) => (
                <div key={symbol} className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="text-xs text-blue-600 dark:text-blue-400">{symbol.split('/')[0]}</div>
                  <div className="text-sm font-bold">${price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* إعدادات الاستراتيجية */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">مستويات DCA:</span>
            <span className="font-medium">{settings?.dcaLevels || 5}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">نسبة R:R:</span>
            <span className="font-medium">1:{settings?.riskReward || 2}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">رأس المال لكل صفقة:</span>
            <span className="font-medium">${settings?.capitalPerTrade || 100}</span>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="w-4 h-4 mr-1" />
                إعدادات
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إعدادات {strategy.name}</DialogTitle>
                <DialogDescription>
                  تخصيص إعدادات الاستراتيجية
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dcaLevels">مستويات DCA</Label>
                  <Input
                    id="dcaLevels"
                    type="number"
                    value={settings?.dcaLevels || 5}
                    onChange={(e) => setSettings({...settings, dcaLevels: parseInt(e.target.value)})}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="riskReward">نسبة المخاطرة:العائد</Label>
                  <Input
                    id="riskReward"
                    type="number"
                    value={settings?.riskReward || 2}
                    onChange={(e) => setSettings({...settings, riskReward: parseFloat(e.target.value)})}
                    min={1}
                    max={5}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="capitalPerTrade">رأس المال لكل صفقة ($)</Label>
                  <Input
                    id="capitalPerTrade"
                    type="number"
                    value={settings?.capitalPerTrade || 100}
                    onChange={(e) => setSettings({...settings, capitalPerTrade: parseInt(e.target.value)})}
                    min={10}
                  />
                </div>
                <Button onClick={handleUpdateSettings} className="w-full">
                  حفظ الإعدادات
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-1" />
            التقرير
          </Button>

          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyCard;
