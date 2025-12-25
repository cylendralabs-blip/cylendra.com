
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTradingData } from '@/hooks/useTradingData';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useState, useEffect, useRef, useMemo } from 'react';

const TradingChart = () => {
  const { activeTrades, isLoading } = useTradingData();
  const { subscribeToSymbol, getPrice } = useRealTimePrices();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  
  // استخدام ref لتتبع الاشتراك الحالي
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // الاشتراك في الأسعار المباشرة مع تنظيف محسن
  useEffect(() => {
    // إلغاء الاشتراك السابق إذا كان موجوداً
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    console.log('TradingChart: Subscribing to price updates for:', selectedSymbol);
    
    const unsubscribe = subscribeToSymbol(selectedSymbol, (priceData) => {
      console.log('TradingChart: Price update received for', selectedSymbol);
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h);
    });

    unsubscribeRef.current = unsubscribe;

    // جلب السعر الحالي إذا كان متوفراً
    const existingPrice = getPrice(selectedSymbol);
    if (existingPrice) {
      console.log('TradingChart: Using existing price for', selectedSymbol);
      setCurrentPrice(existingPrice.price);
      setPriceChange(existingPrice.change24h);
    }

    // تنظيف عند تغيير التبعيات أو إلغاء تثبيت المكون
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedSymbol]); // إزالة subscribeToSymbol و getPrice من التبعيات لتجنب الحلقات

  // Generate chart data based on current price (memoized لتحسين الأداء)
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    const basePrice = currentPrice || 109554;
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * basePrice * 0.02;
      const price = basePrice + variation;
      
      data.push({
        time: time.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }),
        price: price,
        volume: Math.floor(Math.random() * 2000) + 500
      });
    }
    
    return data;
  }, [currentPrice]);

  const handleSymbolChange = (symbol: string) => {
    if (symbol !== selectedSymbol) {
      console.log('Changing symbol from', selectedSymbol, 'to', symbol);
      setSelectedSymbol(symbol);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 p-6 animate-pulse">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </Card>
        <Card className="p-6 animate-pulse">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Price Chart */}
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                تحليل السعر - {selectedSymbol}
              </h3>
              <div className="flex space-x-2">
                {['BTC/USDT', 'ETH/USDT', 'BNB/USDT'].map((pair) => (
                  <Button
                    key={pair}
                    variant={selectedSymbol === pair ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSymbolChange(pair)}
                  >
                    {pair.split('/')[0]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-trading-success">
                ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '109,554.00'}
              </span>
              <Badge className={`${priceChange >= 0 ? 'bg-trading-success' : 'bg-trading-danger'} text-white`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                مباشر
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">1H</Button>
            <Button variant="outline" size="sm">4H</Button>
            <Button variant="default" size="sm">1D</Button>
            <Button variant="outline" size="sm">1W</Button>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64FFDA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#64FFDA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" domain={['dataMin - 50', 'dataMax + 50']} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'السعر']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#64FFDA"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Active Trades */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          الصفقات النشطة
        </h3>
        <div className="space-y-4">
          {activeTrades && activeTrades.length > 0 ? (
            activeTrades.map((trade) => {
              const realTimePrice = getPrice(trade.symbol);
              const currentTradePrice = realTimePrice ? realTimePrice.price : (trade.current_price || trade.entry_price);
              
              return (
                <div key={trade.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {trade.symbol}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${
                          trade.side === 'LONG' 
                            ? 'bg-trading-success text-white' 
                            : 'bg-trading-danger text-white'
                        }`}
                      >
                        {trade.side}
                      </Badge>
                      {realTimePrice && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                          مباشر
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">دخول:</span>
                      <span className="text-gray-900 dark:text-white mr-1">
                        ${Number(trade.entry_price).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">حالي:</span>
                      <span className="text-gray-900 dark:text-white mr-1">
                        ${Number(currentTradePrice).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">الربح:</span>
                      <span className={`mr-1 ${Number(trade.unrealized_pnl) >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                        ${Number(trade.unrealized_pnl).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">DCA:</span>
                      <span className="text-accent mr-1">المستوى {trade.dca_level}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-accent/10 rounded px-2 py-1">
                    <span className="text-xs text-accent font-medium">
                      {((Number(trade.unrealized_pnl) / Number(trade.total_invested)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد صفقات نشطة حالياً</p>
            </div>
          )}
        </div>
        
        <Button className="w-full mt-4 bg-accent text-primary hover:bg-accent/90">
          عرض جميع الصفقات
        </Button>
      </Card>
    </div>
  );
};

export default TradingChart;
