
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';

interface TradingChartProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const TradingChart = ({ selectedSymbol, onSymbolChange }: TradingChartProps) => {
  const { subscribeToSymbol, getPrice } = useRealTimePrices();
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [timeframe, setTimeframe] = useState('1D');

  // الاشتراك في الأسعار المباشرة
  useEffect(() => {
    console.log('SmartTradingChart: Subscribing to price updates for:', selectedSymbol);
    const unsubscribe = subscribeToSymbol(selectedSymbol, (priceData) => {
      console.log('SmartTradingChart: Price update received:', priceData);
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h);
    });

    const existingPrice = getPrice(selectedSymbol);
    if (existingPrice) {
      console.log('SmartTradingChart: Existing price found:', existingPrice);
      setCurrentPrice(existingPrice.price);
      setPriceChange(existingPrice.change24h);
    }

    return unsubscribe;
  }, [selectedSymbol, subscribeToSymbol, getPrice]);

  // توليد بيانات الشارت
  const generateChartData = () => {
    const data = [];
    const now = new Date();
    const basePrice = currentPrice || 109384;
    
    for (let i = 99; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 15 * 60 * 1000);
      const variation = (Math.random() - 0.5) * basePrice * 0.015;
      const price = basePrice + variation;
      
      data.push({
        time: time.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }),
        price: price,
        volume: Math.floor(Math.random() * 1000) + 200
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const popularPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];

  return (
    <CardContent className="p-6 h-full flex flex-col">
      {/* شريط العلوي - اختيار الرمز والإعدادات */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedSymbol}
            </h3>
            <div className="flex items-center space-x-3 space-x-reverse mt-1">
              <span className="text-2xl font-bold text-green-600">
                ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '109,384.00'}
              </span>
              <Badge className={`${priceChange >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                مباشر
              </Badge>
            </div>
          </div>
        </div>

        {/* أزرار الإطار الزمني */}
        <div className="flex space-x-2 space-x-reverse">
          {['15M', '1H', '4H', '1D', '1W'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* أزرار الأزواج الشائعة */}
      <div className="flex space-x-2 space-x-reverse mb-4">
        {popularPairs.map((pair) => (
          <Button
            key={pair}
            variant={selectedSymbol === pair ? "default" : "outline"}
            size="sm"
            onClick={() => onSymbolChange(pair)}
          >
            {pair.split('/')[0]}
          </Button>
        ))}
      </div>

      {/* الشارت */}
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="smartTradeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280" 
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={12}
              domain={['dataMin - 50', 'dataMax + 50']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'السعر']}
              labelFormatter={(label) => `الوقت: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#smartTradeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  );
};

export default TradingChart;
