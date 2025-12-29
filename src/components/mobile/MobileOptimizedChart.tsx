
import React from 'react';
import { useOrientation } from '@/hooks/useOrientation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import TradingChart from '@/components/TradingChart';

interface MobileOptimizedChartProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const MobileOptimizedChart = ({ selectedSymbol, onSymbolChange }: MobileOptimizedChartProps) => {
  const isMobile = useIsMobile();
  const { isLandscape, isPortrait } = useOrientation();

  if (!isMobile) {
    return <TradingChart />;
  }

  return (
    <div className={cn(
      'w-full transition-all duration-300',
      isLandscape ? 'h-screen fixed inset-0 z-50 bg-background' : 'h-auto',
      isPortrait && 'relative'
    )}>
      {isLandscape && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => {
              // يمكن إضافة منطق لإغلاق وضع ملء الشاشة
              if (document.fullscreenElement) {
                document.exitFullscreen();
              }
            }}
            className="bg-black/50 text-white p-2 rounded-full"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className={cn(
        'w-full',
        isLandscape ? 'h-full p-2' : 'h-[300px]'
      )}>
        <TradingChart />
      </div>
      
      {isLandscape && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-2">
          <div className="flex space-x-2 space-x-reverse overflow-x-auto">
            {['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT'].map((symbol) => (
              <button
                key={symbol}
                onClick={() => onSymbolChange(symbol)}
                className={cn(
                  'px-3 py-1 rounded text-sm whitespace-nowrap',
                  selectedSymbol === symbol 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {symbol.split('/')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedChart;
