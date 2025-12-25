
import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, Save, Target, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';

interface SmartTradeFormProps {
  selectedSymbol: string;
  onTradeExecuted: () => void;
  onOrderLevelsUpdate?: (takeProfitPrice?: number, stopLossPrice?: number) => void;
}

const SmartTradeForm = ({ selectedSymbol, onTradeExecuted, onOrderLevelsUpdate }: SmartTradeFormProps) => {
  const { toast } = useToast();
  const { getPrice } = useRealTimePrices();
  
  // حالة النموذج
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'conditional'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [portfolioPercentage, setPortfolioPercentage] = useState(10);
  
  // إعدادات Take Profit
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [takeProfitPercentage, setTakeProfitPercentage] = useState(3);
  
  // إعدادات Stop Loss
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [stopLossPercentage, setStopLossPercentage] = useState(2);
  
  // Trailing Stop
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [trailingDistance, setTrailingDistance] = useState(2);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const priceData = getPrice(selectedSymbol);
    if (priceData) {
      setCurrentPrice(priceData.price);
      setPrice(priceData.price.toString());
    }
  }, [selectedSymbol, getPrice]);

  // حساب الأسعار التلقائي وإرسالها للشارت
  useEffect(() => {
    if (currentPrice > 0) {
      let tpPrice: number | undefined;
      let slPrice: number | undefined;

      if (takeProfitEnabled) {
        tpPrice = side === 'buy' 
          ? currentPrice * (1 + takeProfitPercentage / 100)
          : currentPrice * (1 - takeProfitPercentage / 100);
        setTakeProfitPrice(tpPrice.toFixed(2));
      }
      
      if (stopLossEnabled) {
        slPrice = side === 'buy'
          ? currentPrice * (1 - stopLossPercentage / 100)
          : currentPrice * (1 + stopLossPercentage / 100);
        setStopLossPrice(slPrice.toFixed(2));
      }

      // إرسال التحديث للشارت
      if (onOrderLevelsUpdate) {
        onOrderLevelsUpdate(tpPrice, slPrice);
      }
    }
  }, [currentPrice, takeProfitPercentage, stopLossPercentage, side, takeProfitEnabled, stopLossEnabled, onOrderLevelsUpdate]);

  // تحديث السعر يدوياً
  const handleTakeProfitPriceChange = (value: string) => {
    setTakeProfitPrice(value);
    if (onOrderLevelsUpdate && value) {
      onOrderLevelsUpdate(Number(value), stopLossPrice ? Number(stopLossPrice) : undefined);
    }
  };

  const handleStopLossPriceChange = (value: string) => {
    setStopLossPrice(value);
    if (onOrderLevelsUpdate && value) {
      onOrderLevelsUpdate(takeProfitPrice ? Number(takeProfitPrice) : undefined, Number(value));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // محاكاة تنفيذ الصفقة
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "تم تنفيذ الصفقة بنجاح",
        description: `${side === 'buy' ? 'شراء' : 'بيع'} ${amount} ${selectedSymbol}`,
      });
      
      onTradeExecuted();
      
      // إعادة تعيين النموذج
      setAmount('');
      setTakeProfitEnabled(false);
      setStopLossEnabled(false);
      setTrailingStopEnabled(false);
      
    } catch (error) {
      toast({
        title: "خطأ في تنفيذ الصفقة",
        description: "حدث خطأ أثناء تنفيذ الصفقة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const portfolioOptions = [5, 10, 25, 50, 100];

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Target className="w-5 h-5 mr-2" />
          التداول الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نوع الأمر والاتجاه */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">أمر السوق</SelectItem>
              <SelectItem value="limit">أمر محدود</SelectItem>
              <SelectItem value="conditional">أمر مشروط</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={side} onValueChange={(value: any) => setSide(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                شراء
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-red-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                بيع
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* السعر للأوامر المحدودة */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-1" />
              السعر (USDT)
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="أدخل السعر"
              step="0.01"
            />
          </div>
        )}

        {/* المبلغ */}
        <div className="space-y-2">
          <label className="text-sm font-medium">المبلغ (USDT)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="أدخل المبلغ"
            step="0.01"
          />
        </div>

        {/* نسب المحفظة */}
        <div className="space-y-2">
          <label className="text-sm font-medium">نسبة من المحفظة</label>
          <div className="flex space-x-2 space-x-reverse">
            {portfolioOptions.map((percentage) => (
              <Button
                key={percentage}
                variant={portfolioPercentage === percentage ? "default" : "outline"}
                size="sm"
                onClick={() => setPortfolioPercentage(percentage)}
                className="flex-1"
              >
                {percentage}%
              </Button>
            ))}
          </div>
        </div>

        {/* إعدادات متقدمة */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            إدارة المخاطر
          </h4>
          
          {/* Take Profit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                جني الأرباح
              </label>
              <Switch
                checked={takeProfitEnabled}
                onCheckedChange={setTakeProfitEnabled}
              />
            </div>
            {takeProfitEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={takeProfitPercentage}
                  onChange={(e) => setTakeProfitPercentage(Number(e.target.value))}
                  placeholder="نسبة %"
                  step="0.1"
                />
                <Input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => handleTakeProfitPriceChange(e.target.value)}
                  placeholder="السعر"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Stop Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm flex items-center">
                <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                وقف الخسائر
              </label>
              <Switch
                checked={stopLossEnabled}
                onCheckedChange={setStopLossEnabled}
              />
            </div>
            {stopLossEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={stopLossPercentage}
                  onChange={(e) => setStopLossPercentage(Number(e.target.value))}
                  placeholder="نسبة %"
                  step="0.1"
                />
                <Input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => handleStopLossPriceChange(e.target.value)}
                  placeholder="السعر"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Trailing Stop */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">وقف خسائر متحرك</label>
              <Switch
                checked={trailingStopEnabled}
                onCheckedChange={setTrailingStopEnabled}
              />
            </div>
            {trailingStopEnabled && (
              <Input
                type="number"
                value={trailingDistance}
                onChange={(e) => setTrailingDistance(Number(e.target.value))}
                placeholder="المسافة %"
                step="0.1"
              />
            )}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount}
            className={`w-full ${
              side === 'buy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'جاري التنفيذ...' : `${side === 'buy' ? 'شراء' : 'بيع'} ${selectedSymbol}`}
          </Button>

          <Button variant="outline" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            حفظ كإعداد مسبق
          </Button>
        </div>

        {/* معلومات الصفقة */}
        {amount && currentPrice > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>الكمية المقدرة:</span>
                <span>{(Number(amount) / currentPrice).toFixed(6)} {selectedSymbol.split('/')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>السعر الحالي:</span>
                <span>${currentPrice.toFixed(2)}</span>
              </div>
              {takeProfitEnabled && takeProfitPrice && (
                <div className="flex justify-between text-green-600">
                  <span>جني الأرباح:</span>
                  <span>${takeProfitPrice}</span>
                </div>
              )}
              {stopLossEnabled && stopLossPrice && (
                <div className="flex justify-between text-red-600">
                  <span>وقف الخسائر:</span>
                  <span>${stopLossPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};

export default SmartTradeForm;
