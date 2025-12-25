
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import TradingViewChart from './TradingViewChart';
import OrderBook from './OrderBook';
import TradingTabs from './TradingTabs';
import ActiveSmartTrades from './ActiveSmartTrades';
import PlatformSymbolSelector from './PlatformSymbolSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrientation } from '@/hooks/useOrientation';
import SwipeableCard from '@/components/mobile/SwipeableCard';
import MobileOptimizedChart from '@/components/mobile/MobileOptimizedChart';
import { cn } from '@/lib/utils';

interface SmartTradeInterfaceProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const SmartTradeInterface = ({ selectedSymbol, onSymbolChange }: SmartTradeInterfaceProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>();
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('9a05d808-9171-469d-a5b2-57459b60af41');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const isMobile = useIsMobile();
  const { isLandscape } = useOrientation();

  const handleTradeExecuted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOrderLevelsUpdate = (tp?: number, sl?: number) => {
    setTakeProfitPrice(tp);
    setStopLossPrice(sl);
  };

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatform(platformId);
    console.log('Platform changed to:', platformId);
  };

  // التنقل بين التبويبات بالـ swipe على الموبايل
  const handleTabSwipe = (direction: 'left' | 'right') => {
    if (!isMobile) return;
    
    if (direction === 'left' && activeTabIndex < 2) {
      setActiveTabIndex(prev => prev + 1);
    } else if (direction === 'right' && activeTabIndex > 0) {
      setActiveTabIndex(prev => prev - 1);
    }
  };

  // تخطيط خاص للوضع الأفقي على الموبايل
  if (isMobile && isLandscape) {
    return (
      <div className="h-screen flex landscape-layout">
        {/* الشارت يأخذ 70% من الشاشة */}
        <div className="w-[70%] h-full">
          <MobileOptimizedChart 
            selectedSymbol={selectedSymbol}
            onSymbolChange={onSymbolChange}
          />
        </div>
        
        {/* الشريط الجانبي للتحكم */}
        <div className="w-[30%] h-full overflow-y-auto bg-background border-l">
          <div className="p-2 space-y-2">
            <div className="text-xs">
              <PlatformSymbolSelector
                selectedPlatform={selectedPlatform}
                selectedSymbol={selectedSymbol}
                onPlatformChange={handlePlatformChange}
                onSymbolChange={onSymbolChange}
              />
            </div>
            
            <div className="h-[200px]">
              <OrderBook 
                symbol={selectedSymbol} 
                platformId={selectedPlatform}
                layout="vertical"
              />
            </div>
            
            <div className="h-[300px]">
              <TradingTabs 
                selectedSymbol={selectedSymbol}
                selectedPlatform={selectedPlatform}
                onTradeExecuted={handleTradeExecuted}
                onOrderLevelsUpdate={handleOrderLevelsUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // التخطيط العادي (عمودي أو ديسكتوب)
  return (
    <div className={cn(
      isMobile ? 'flex flex-col space-y-3 p-2' : 'space-y-6',
      'min-h-[80vh] bg-gradient-trading'
    )}>
      {/* محدد المنصة وزوج العملة */}
      <div className="w-full animate-fade-in">
        <PlatformSymbolSelector
          selectedPlatform={selectedPlatform}
          selectedSymbol={selectedSymbol}
          onPlatformChange={handlePlatformChange}
          onSymbolChange={onSymbolChange}
        />
      </div>

      {/* الشارت - محسن للموبايل */}
      <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {isMobile ? (
          <SwipeableCard
            onSwipeLeft={() => handleTabSwipe('left')}
            onSwipeRight={() => handleTabSwipe('right')}
            className="trading-card"
          >
            <TradingViewChart 
              selectedSymbol={selectedSymbol}
              onSymbolChange={onSymbolChange}
              takeProfitPrice={takeProfitPrice}
              stopLossPrice={stopLossPrice}
            />
          </SwipeableCard>
        ) : (
          <Card className="trading-card card-hover">
            <TradingViewChart 
              selectedSymbol={selectedSymbol}
              onSymbolChange={onSymbolChange}
              takeProfitPrice={takeProfitPrice}
              stopLossPrice={stopLossPrice}
            />
          </Card>
        )}
      </div>

      {/* دفتر الأوامر - محسن للموبايل */}
      <div className="w-full animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
        <SwipeableCard
          className={cn(
            'trading-card',
            isMobile ? 'h-[280px]' : 'h-[300px] card-hover'
          )}
          onSwipeUp={() => {
            // يمكن إضافة منطق لتوسيع دفتر الأوامر
          }}
        >
          <OrderBook 
            symbol={selectedSymbol} 
            platformId={selectedPlatform}
            layout="vertical"
          />
        </SwipeableCard>
      </div>

      {/* نظام التبويبات - محسن للموبايل */}
      <div className="w-full animate-float-up" style={{ animationDelay: '0.3s' }}>
        <SwipeableCard
          className={cn(
            'trading-card',
            !isMobile && 'card-hover'
          )}
          onSwipeLeft={() => handleTabSwipe('left')}
          onSwipeRight={() => handleTabSwipe('right')}
        >
          <TradingTabs 
            selectedSymbol={selectedSymbol}
            selectedPlatform={selectedPlatform}
            onTradeExecuted={handleTradeExecuted}
            onOrderLevelsUpdate={handleOrderLevelsUpdate}
          />
        </SwipeableCard>
      </div>

      {/* الصفقات النشطة - محسنة للموبايل */}
      <div className="w-full animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <SwipeableCard className={cn(
          'trading-card',
          !isMobile && 'card-hover'
        )}>
          <ActiveSmartTrades key={refreshKey} />
        </SwipeableCard>
      </div>

      {/* مؤشر التبويبات للموبايل */}
      {isMobile && (
        <div className="flex justify-center space-x-2 space-x-reverse py-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                activeTabIndex === index ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartTradeInterface;
