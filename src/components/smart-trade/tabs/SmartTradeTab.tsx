
import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, Target, Shield, Loader2, Info, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useBotSettings } from '@/hooks/useBotSettings';
import { useTradeCalculations } from '@/hooks/useTradeCalculations';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useRiskProfile, validateTradeAgainstRiskProfile } from '@/hooks/useRiskProfile';
import { useSymbolSignals, UnifiedSignal } from '@/hooks/useSymbolSignals';
import { TechnicalSummaryWidget } from '@/components/smart-trade/TechnicalSummaryWidget';
import { Sparkles } from 'lucide-react';

interface SmartTradeTabProps {
  selectedSymbol: string;
  selectedPlatform: string;
  onTradeExecuted: () => void;
  onOrderLevelsUpdate?: (takeProfitPrice?: number, stopLossPrice?: number) => void;
}

const SmartTradeTab = ({ 
  selectedSymbol, 
  selectedPlatform, 
  onTradeExecuted, 
  onOrderLevelsUpdate 
}: SmartTradeTabProps) => {
  const { toast } = useToast();
  const { getPrice } = useRealTimePrices();
  const { botSettings } = useBotSettings();
  const { executeTrade, loading: executing } = useTradeExecution();
  
  // حالة النموذج الأساسية
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('futures');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'conditional'>('limit');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  
  // إعدادات الوحدات والشراء
  const [units, setUnits] = useState('');
  const [useExistingAssets, setUseExistingAssets] = useState(false);
  const [buyPriceType, setBuyPriceType] = useState<'limit' | 'market' | 'conditional'>('limit');
  const [limitPrice, setLimitPrice] = useState('');
  const [trailingBuy, setTrailingBuy] = useState(false);
  const [trailingBuyDeviation, setTrailingBuyDeviation] = useState(1);
  
  // إعدادات Take Profit
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitType, setTakeProfitType] = useState<'limit' | 'market'>('limit');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [takeProfitPercentage, setTakeProfitPercentage] = useState(10);
  const [splitTargets, setSplitTargets] = useState(false);
  const [trailingTakeProfit, setTrailingTakeProfit] = useState(false);
  const [trailingTakeProfitDeviation, setTrailingTakeProfitDeviation] = useState(5);
  
  // إعدادات Stop Loss
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossType, setStopLossType] = useState<'conditional_limit' | 'conditional_market'>('conditional_market');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [stopLossPercentage, setStopLossPercentage] = useState(-2.56);
  const [stopLossTimeout, setStopLossTimeout] = useState(300);
  const [trailingStopLoss, setTrailingStopLoss] = useState(false);
  const [moveToBreakeven, setMoveToBreakeven] = useState(false);
  
  // حجم الصفقة
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);

  // Phase 3.1: Bot management mode
  const [managedByBot, setManagedByBot] = useState(false);

  // استخدام hooks للبيانات
  const { getAvailableBalance } = usePortfolioData(selectedPlatform, marketType);
  const availableBalance = getAvailableBalance(botSettings);
  const riskProfile = useRiskProfile(botSettings);
  
  const priceData = getPrice(selectedSymbol);
  const currentPrice = priceData?.price || 0;

  // Phase 2.1: Fetch signals for the symbol
  const { data: signalsData } = useSymbolSignals(
    selectedSymbol,
    selectedPlatform,
    undefined, // timeframe - will use chart timeframe
    { enabled: true, maxSignals: 5, minConfidence: 60 }
  );

  const latestSignal = signalsData?.latestSignal;
  
  // Fix: Convert buyPriceType to valid type for useTradeCalculations
  const validOrderType: 'market' | 'limit' = buyPriceType === 'conditional' ? 'limit' : buyPriceType;
  
  const { tradeCalculation } = useTradeCalculations(
    selectedSymbol,
    currentPrice,
    Math.abs(stopLossPercentage),
    botSettings,
    marketType,
    validOrderType,
    Number(limitPrice) || currentPrice,
    availableBalance
  );

  // تحديث السعر المحدود عند تغيير السعر الحالي
  useEffect(() => {
    if (buyPriceType === 'limit' && currentPrice > 0) {
      setLimitPrice(currentPrice.toString());
    }
  }, [currentPrice, buyPriceType]);

  // حساب Take Profit و Stop Loss تلقائياً
  useEffect(() => {
    if (currentPrice > 0) {
      const entryPrice = Number(limitPrice) || currentPrice;
      
      // Calculate both prices upfront
      let tpPrice: number | undefined;
      let slPrice: number | undefined;
      
      if (takeProfitEnabled) {
        tpPrice = tradeDirection === 'long' 
          ? entryPrice * (1 + takeProfitPercentage / 100)
          : entryPrice * (1 - takeProfitPercentage / 100);
        setTakeProfitPrice(tpPrice.toFixed(5));
      }
      
      if (stopLossEnabled) {
        slPrice = tradeDirection === 'long'
          ? entryPrice * (1 + stopLossPercentage / 100)
          : entryPrice * (1 - stopLossPercentage / 100);
        setStopLossPrice(slPrice.toFixed(5));
      }
      
      // Call onOrderLevelsUpdate once with both calculated values
      if (onOrderLevelsUpdate && (takeProfitEnabled || stopLossEnabled)) {
        onOrderLevelsUpdate(tpPrice, slPrice);
      }
    }
  }, [currentPrice, limitPrice, takeProfitPercentage, stopLossPercentage, tradeDirection, takeProfitEnabled, stopLossEnabled, onOrderLevelsUpdate]);

  // حساب المبلغ من النسبة المئوية
  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    const amount = (availableBalance * percentage) / 100;
    setTotalAmount(amount.toFixed(2));
    
    // حساب الوحدات
    if (currentPrice > 0) {
      const calculatedUnits = amount / currentPrice;
      setUnits(calculatedUnits.toFixed(8));
    }
  };

  // حساب الوحدات عند تغيير المبلغ الكلي
  useEffect(() => {
    if (totalAmount && currentPrice > 0) {
      const calculatedUnits = Number(totalAmount) / currentPrice;
      setUnits(calculatedUnits.toFixed(8));
    }
  }, [totalAmount, currentPrice]);

  // Phase 2.3: Use signal to auto-fill trade settings
  const handleUseSignal = (signal: UnifiedSignal) => {
    if (!signal || !botSettings) return;

    // Set trade direction
    setTradeDirection(signal.direction === 'BUY' ? 'long' : 'short');

    // Set entry price
    if (signal.entryPrice > 0) {
      setLimitPrice(signal.entryPrice.toString());
    }

    // Set Take Profit
    if (signal.takeProfitPrice && signal.takeProfitPrice > 0) {
      setTakeProfitEnabled(true);
      setTakeProfitPrice(signal.takeProfitPrice.toString());
      // Calculate percentage
      const entryPrice = signal.entryPrice;
      const tpPercentage = ((signal.takeProfitPrice - entryPrice) / entryPrice) * 100;
      setTakeProfitPercentage(Math.abs(tpPercentage));
    }

    // Set Stop Loss
    if (signal.stopLossPrice && signal.stopLossPrice > 0) {
      setStopLossEnabled(true);
      setStopLossPrice(signal.stopLossPrice.toString());
      // Calculate percentage
      const entryPrice = signal.entryPrice;
      const slPercentage = ((signal.stopLossPrice - entryPrice) / entryPrice) * 100;
      setStopLossPercentage(slPercentage);
    }

    // Trigger recalculation
    if (tradeCalculation) {
      // Force recalculation by updating dependencies
      setTimeout(() => {
        // This will trigger useTradeCalculations to recalculate
      }, 100);
    }

    toast({
      title: 'تم تطبيق الإشارة',
      description: `تم ملء الإعدادات من إشارة ${signal.source} (ثقة: ${signal.confidence.toFixed(0)}%)`,
      variant: 'default',
    });
  };

  const handleExecuteTrade = async () => {
    if (!tradeCalculation) {
      toast({
        title: 'خطأ',
        description: 'لا توجد حسابات للصفقة متاحة',
        variant: 'destructive',
      });
      return;
    }

    // Phase 1.4: Validate against risk profile
    if (riskProfile && botSettings) {
      const validation = validateTradeAgainstRiskProfile(
        tradeCalculation,
        availableBalance,
        riskProfile
      );

      if (!validation.valid) {
        toast({
          title: 'خطأ في التحقق من المخاطر',
          description: validation.errors.join('\n'),
          variant: 'destructive',
        });
        return;
      }

      if (validation.warnings.length > 0 && validation.riskLevel === 'warning') {
        // Show warning but allow execution
        toast({
          title: 'تحذير',
          description: validation.warnings.join('\n'),
          variant: 'default',
        });
      }
    }

    const success = await executeTrade(
      tradeCalculation,
      selectedPlatform,
      selectedSymbol,
      marketType,
      validOrderType,
      tradeDirection,
      currentPrice,
      Number(limitPrice) || currentPrice,
      botSettings!,
      false,
      availableBalance,
      'manual_smart_trade', // Phase 1.5: Tag as Smart Trade execution
      managedByBot, // Phase 3.1: Bot management mode
      botSettings?.id // Phase 3.1: Management profile ID (bot settings ID)
    );

    if (success) {
      onTradeExecuted();
      // إعادة تعيين النموذج
      setUnits('');
      setTotalAmount('');
      setSelectedPercentage(null);
    }
  };

  if (!botSettings) {
    return (
      <CardContent className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="mr-2">جاري تحميل الإعدادات...</span>
      </CardContent>
    );
  }

  const baseCurrency = selectedSymbol.split('/')[0];
  const quoteCurrency = selectedSymbol.split('/')[1] || 'USDT';

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Smart Trade - {selectedSymbol}
          </CardTitle>
          
          {/* Phase 2.3: Use Signal button */}
          {latestSignal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUseSignal(latestSignal)}
              className="flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Use Signal</span>
              <Badge variant="outline" className="text-[8px]">
                {latestSignal.confidence.toFixed(0)}%
              </Badge>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Info className="w-4 h-4" />
          <span>How does Smart Trade work?</span>
        </div>
        {latestSignal && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Latest {latestSignal.source === 'ai' ? 'AI' : latestSignal.source === 'tradingview' ? 'TradingView' : 'Enhanced'} Signal:
              </span>
              <Badge 
                variant={latestSignal.direction === 'BUY' ? 'default' : 'destructive'}
                className="text-[8px]"
              >
                {latestSignal.direction} @ ${latestSignal.entryPrice.toFixed(2)}
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Phase 2.4: Technical Summary Widget */}
        <TechnicalSummaryWidget 
          symbol={selectedSymbol}
          timeframe="1h"
          platform={selectedPlatform}
        />

        {/* قسم الوحدات */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-foreground">Units</label>
            <div className="flex items-center text-xs text-gray-500">
              <span>{units} {baseCurrency}</span>
              <HelpCircle className="w-3 h-3 mr-1" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-sm">Use Existing Assets</label>
              <Badge variant="outline" className="text-[8px]">Soon</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={useExistingAssets}
                onCheckedChange={(checked) => {
                  if (checked) {
                    toast({
                      title: 'قريباً',
                      description: 'Use Existing Assets قيد التطوير',
                      variant: 'default',
                    });
                  } else {
                    setUseExistingAssets(false);
                  }
                }}
                disabled
              />
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {useExistingAssets && (
            <Input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="0.0000"
              step="0.00000001"
              className="text-right"
            />
          )}
          
          {!useExistingAssets && units && (
            <div className="text-xs text-red-500">
              Trade does not meet minimum requirements: 0.0001 {baseCurrency}
            </div>
          )}
        </div>

        {/* قسم سعر الشراء */}
        <div className="space-y-3">
          <label className="text-lg font-bold text-foreground">Buy Price</label>
          
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded">
            <Button
              variant={buyPriceType === 'limit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBuyPriceType('limit')}
              className="text-xs"
            >
              Limit
            </Button>
            <Button
              variant={buyPriceType === 'market' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBuyPriceType('market')}
              className="text-xs"
            >
              Market
            </Button>
            <Button
              variant={buyPriceType === 'conditional' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                toast({
                  title: 'قريباً',
                  description: 'الأوامر الشرطية قيد التطوير',
                  variant: 'default',
                });
              }}
              className="text-xs"
              disabled
            >
              Cond. <Badge variant="outline" className="mr-1 text-[8px]">Soon</Badge>
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Will be placed on the exchange order book. Can't buy higher than the current price
          </div>
          
          {buyPriceType === 'limit' && (
            <div className="space-y-2">
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                step="0.00001"
                className="text-right"
              />
              <div className="text-xs text-center space-y-1">
                <div className="text-blue-500">Bid: {(currentPrice * 0.9999).toFixed(5)}{quoteCurrency}</div>
                <div className="text-red-500">Ask: {(currentPrice * 1.0001).toFixed(5)}{quoteCurrency}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-sm">Trailing buy</label>
              <Badge variant="outline" className="text-[8px]">Soon</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={trailingBuy}
                onCheckedChange={(checked) => {
                  if (checked) {
                    toast({
                      title: 'قريباً',
                      description: 'Trailing buy قيد التطوير',
                      variant: 'default',
                    });
                  } else {
                    setTrailingBuy(false);
                  }
                }}
                disabled
              />
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {trailingBuy && (
            <div className="space-y-2">
              <Slider
                value={[trailingBuyDeviation]}
                onValueChange={(value) => setTrailingBuyDeviation(value[0])}
                max={10}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-center">{trailingBuyDeviation}%</div>
            </div>
          )}
        </div>

        {/* قسم المجموع */}
        <div className="space-y-3">
          <label className="text-lg font-bold text-foreground">Total</label>
          <Input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00000000"
            step="0.00000001"
            className="text-right"
          />
          
          {totalAmount && (
            <div className="text-xs text-red-500">
              Trade does not meet minimum requirements: 0.00015 {quoteCurrency}
            </div>
          )}
          
          <div>
            <div className="text-sm font-medium mb-2">Size from available amount</div>
            <div className="grid grid-cols-5 gap-1">
              {[5, 10, 25, 50, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant={selectedPercentage === percentage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePercentageClick(percentage)}
                  className="text-xs"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* قسم Take Profit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-foreground">Take Profit</label>
            <Switch
              checked={takeProfitEnabled}
              onCheckedChange={setTakeProfitEnabled}
            />
          </div>
          
          {takeProfitEnabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded">
                <Button
                  variant={takeProfitType === 'limit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTakeProfitType('limit')}
                  className="text-xs"
                >
                  Limit Order
                </Button>
                <Button
                  variant={takeProfitType === 'market' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTakeProfitType('market')}
                  className="text-xs"
                >
                  Market Order
                </Button>
              </div>
              
              <div className="text-xs text-center text-gray-500">
                The order will be placed on the exchange order book beforehand
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="Price"
                  step="0.00001"
                  className="text-xs"
                />
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={takeProfitPercentage}
                    onChange={(e) => setTakeProfitPercentage(Number(e.target.value))}
                    step="0.01"
                    className="text-xs"
                  />
                  <span className="text-xs text-green-600 mr-1">%</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  toast({
                    title: 'قريباً',
                    description: 'Split Targets قيد التطوير',
                    variant: 'default',
                  });
                }}
                disabled
              >
                Split Targets <Badge variant="outline" className="mr-1 text-[8px]">Soon</Badge>
              </Button>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-xs">Trailing Take Profit</label>
                  <Badge variant="outline" className="text-[8px]">Soon</Badge>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </div>
                <Switch
                  checked={trailingTakeProfit}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      toast({
                        title: 'قريباً',
                        description: 'Trailing Take Profit قيد التطوير',
                        variant: 'default',
                      });
                    } else {
                      setTrailingTakeProfit(false);
                    }
                  }}
                  disabled
                />
              </div>
              
              {trailingTakeProfit && (
                <div className="space-y-2">
                  <div className="text-xs">Follow max price with deviation (%)</div>
                  <Slider
                    value={[trailingTakeProfitDeviation]}
                    onValueChange={(value) => setTrailingTakeProfitDeviation(value[0])}
                    max={20}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-center">-{trailingTakeProfitDeviation}.00%</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* قسم Stop Loss */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-foreground">Stop Loss</label>
            <Switch
              checked={stopLossEnabled}
              onCheckedChange={setStopLossEnabled}
            />
          </div>
          
          {stopLossEnabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded">
                <Button
                  variant={stopLossType === 'conditional_limit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStopLossType('conditional_limit')}
                  className="text-xs"
                >
                  Cond. Limit Order
                </Button>
                <Button
                  variant={stopLossType === 'conditional_market' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStopLossType('conditional_market')}
                  className="text-xs"
                >
                  Cond. Market Order
                </Button>
              </div>
              
              <div className="text-xs text-center text-gray-500">
                The order will be executed at market price when the price meets Stop Loss conditions
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="Price"
                  step="0.00001"
                  className="text-xs"
                />
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={stopLossPercentage}
                    onChange={(e) => setStopLossPercentage(Number(e.target.value))}
                    step="0.01"
                    className="text-xs"
                  />
                  <span className="text-xs text-red-600 mr-1">%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-xs">Stop Loss timeout</label>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={stopLossTimeout}
                  onChange={(e) => setStopLossTimeout(Number(e.target.value))}
                  className="text-xs w-20"
                />
                <span className="text-xs">seconds</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-xs">Trailing Stop Loss</label>
                  <Badge variant="outline" className="text-[8px]">Soon</Badge>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </div>
                <Switch
                  checked={trailingStopLoss}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      toast({
                        title: 'قريباً',
                        description: 'Trailing Stop Loss قيد التطوير',
                        variant: 'default',
                      });
                    } else {
                      setTrailingStopLoss(false);
                    }
                  }}
                  disabled
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-xs">Move to Breakeven</label>
                  <Badge variant="outline" className="text-[8px]">Soon</Badge>
                  <HelpCircle className="w-3 h-3 text-gray-400" />
                </div>
                <Switch
                  checked={moveToBreakeven}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      toast({
                        title: 'قريباً',
                        description: 'Move to Breakeven قيد التطوير',
                        variant: 'default',
                      });
                    } else {
                      setMoveToBreakeven(false);
                    }
                  }}
                  disabled
                />
              </div>
            </div>
          )}
        </div>

        {/* Phase 3.1: Bot Management Toggle */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Bot manage this trade?
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bot will manage SL, trailing, and DCA after opening
                </p>
              </div>
            </div>
            <Switch
              checked={managedByBot}
              onCheckedChange={setManagedByBot}
            />
          </div>

          {/* Phase 3.3: Show management options if enabled */}
          {managedByBot && botSettings && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xs space-y-1">
                <div className="font-medium text-green-900 dark:text-green-100">
                  Management Profile: {botSettings.bot_name || 'Default'}
                </div>
                <div className="text-green-700 dark:text-green-300">
                  • SL moves to BE at +{botSettings.capital_protection_profit || 2}% profit
                </div>
                {botSettings.trailing_stop_distance && botSettings.trailing_stop_distance > 0 && (
                  <div className="text-green-700 dark:text-green-300">
                    • Trailing stop: {botSettings.trailing_stop_distance}%
                  </div>
                )}
                <div className="text-green-700 dark:text-green-300">
                  • Max DCA levels: {botSettings.dca_levels || 3}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleExecuteTrade}
            disabled={executing || !totalAmount || Number(totalAmount) === 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Trade...
              </>
            ) : (
              `Create Trade`
            )}
          </Button>

          <Button variant="outline" className="w-full">
            Save Preset
          </Button>
          
          <div className="text-xs text-center text-gray-500">
            Orders will be placed automatically according to DCA settings once trade is created
          </div>
        </div>

        {/* معلومات الرصيد */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Available: ${availableBalance.toFixed(2)}</div>
          <div>Current Price: ${currentPrice.toFixed(5)}</div>
          <div>Platform: {selectedPlatform.includes('binance') ? 'Binance' : 'Unknown'}</div>
        </div>
      </CardContent>
    </>
  );
};

export default SmartTradeTab;
