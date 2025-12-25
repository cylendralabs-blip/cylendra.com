
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import TradingViewChart from './TradingViewChart';
import OrderBook from './OrderBook';
import SmartTradeForm from './SmartTradeForm';
import ActiveSmartTrades from './ActiveSmartTrades';

interface EnhancedSmartTradeInterfaceProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const EnhancedSmartTradeInterface = ({ selectedSymbol, onSymbolChange }: EnhancedSmartTradeInterfaceProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>();
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>();

  const handleTradeExecuted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTakeProfitChange = (price: number) => {
    setTakeProfitPrice(price);
  };

  const handleStopLossChange = (price: number) => {
    setStopLossPrice(price);
  };

  const handleOrderLevelsUpdate = (tp?: number, sl?: number) => {
    setTakeProfitPrice(tp);
    setStopLossPrice(sl);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[80vh]">
      {/* الشارت الجديد - يأخذ معظم المساحة */}
      <div className="lg:col-span-8">
        <TradingViewChart 
          selectedSymbol={selectedSymbol}
          onSymbolChange={onSymbolChange}
          takeProfitPrice={takeProfitPrice}
          stopLossPrice={stopLossPrice}
          onTakeProfitChange={handleTakeProfitChange}
          onStopLossChange={handleStopLossChange}
        />
      </div>

      {/* العمود الجانبي الأيمن */}
      <div className="lg:col-span-4 space-y-4">
        {/* Order Book */}
        <Card className="h-80">
          <OrderBook symbol={selectedSymbol} />
        </Card>

        {/* نموذج التداول الذكي المحسن */}
        <Card>
          <SmartTradeForm 
            selectedSymbol={selectedSymbol}
            onTradeExecuted={handleTradeExecuted}
            onOrderLevelsUpdate={handleOrderLevelsUpdate}
          />
        </Card>
      </div>

      {/* الصفقات النشطة - في الأسفل */}
      <div className="lg:col-span-12">
        <Card>
          <ActiveSmartTrades key={refreshKey} />
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSmartTradeInterface;
