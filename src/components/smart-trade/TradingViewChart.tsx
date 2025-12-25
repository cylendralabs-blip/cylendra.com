
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSymbolSignals, UnifiedSignal } from '@/hooks/useSymbolSignals';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

interface TradingViewChartProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  onTakeProfitChange?: (price: number) => void;
  onStopLossChange?: (price: number) => void;
  timeframe?: string;
}

const TradingViewChart = ({ 
  selectedSymbol, 
  onSymbolChange,
  takeProfitPrice,
  stopLossPrice,
  onTakeProfitChange,
  onStopLossChange,
  timeframe: externalTimeframe
}: TradingViewChartProps) => {
  const { subscribeToSymbol, getPrice } = useRealTimePrices();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [timeframe, setTimeframe] = useState(externalTimeframe || '1D');
  const [isChartLoaded, setIsChartLoaded] = useState(false);
  const [showAISignals, setShowAISignals] = useState(true);
  const [showTradingViewSignals, setShowTradingViewSignals] = useState(true);
  const isMobile = useIsMobile();

  // Phase 2.1: Fetch signals for the symbol
  const { data: signalsData } = useSymbolSignals(
    selectedSymbol,
    undefined,
    timeframe,
    { enabled: true, maxSignals: 5, minConfidence: 60 }
  );

  const latestSignal = signalsData?.latestSignal;
  const recentSignals = signalsData?.recentSignals || [];

  const popularPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];

  // الاشتراك في الأسعار المباشرة
  useEffect(() => {
    console.log('TradingViewChart: Subscribing to price updates for:', selectedSymbol);
    const unsubscribe = subscribeToSymbol(selectedSymbol, (priceData) => {
      console.log('TradingViewChart: Price update received:', priceData);
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h);
    });

    // جلب السعر الحالي إذا كان متوفراً
    const existingPrice = getPrice(selectedSymbol);
    if (existingPrice) {
      console.log('TradingViewChart: Existing price found:', existingPrice);
      setCurrentPrice(existingPrice.price);
      setPriceChange(existingPrice.change24h);
    }

    return unsubscribe;
  }, [selectedSymbol, subscribeToSymbol, getPrice]);

  // تحويل رمز التداول لتنسيق TradingView
  const convertToTradingViewSymbol = (symbol: string) => {
    const symbolMap: {[key: string]: string} = {
      'BTC/USDT': 'BINANCE:BTCUSDT',
      'ETH/USDT': 'BINANCE:ETHUSDT',
      'BNB/USDT': 'BINANCE:BNBUSDT',
      'ADA/USDT': 'BINANCE:ADAUSDT',
      'SOL/USDT': 'BINANCE:SOLUSDT'
    };
    return symbolMap[symbol] || 'BINANCE:BTCUSDT';
  };

  // Suppress TradingView telemetry errors (blocked by ad-blockers)
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Suppress TradingView telemetry errors
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('telemetry.tradingview.com') ||
        message.includes('Failed to fetch') ||
        message.includes('ERR_BLOCKED_BY_CLIENT') ||
        message.includes('ublock-filters')
      ) {
        // Silently ignore TradingView telemetry errors
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('telemetry.tradingview.com') ||
        message.includes('Failed to fetch') ||
        message.includes('ERR_BLOCKED_BY_CLIENT')
      ) {
        // Silently ignore TradingView telemetry warnings
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // تحميل وإنشاء مخطط TradingView مبسط
  useEffect(() => {
    // Capture the current ref value to use in cleanup
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    // إزالة المحتوى السابق
    chartContainer.innerHTML = '';

    try {
      // إنشاء iframe لـ TradingView
      const iframe = document.createElement('iframe');
      const symbol = convertToTradingViewSymbol(selectedSymbol);
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol}&interval=${timeframe}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&hideideas=1&theme=${theme}&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=ar&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`;
      
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.frameBorder = '0';
      iframe.scrolling = 'no';
      
      // Suppress iframe errors
      iframe.onerror = () => {
        // Silently handle iframe errors
      };
      
      chartContainer.appendChild(iframe);
      
      // تعيين تحميل الشارت كمكتمل بعد تحميل الـ iframe
      iframe.onload = () => {
        setIsChartLoaded(true);
      };

      // في حالة عدم تحميل الـ iframe، نظهر الشارت كمحمل بعد ثانيتين
      const fallbackTimer = setTimeout(() => {
        setIsChartLoaded(true);
      }, 2000);

      return () => {
        clearTimeout(fallbackTimer);
        // Use the captured ref value in cleanup
        if (chartContainer) {
          chartContainer.innerHTML = '';
        }
      };
    } catch (error) {
      // Only log non-TradingView errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('tradingview') && !errorMessage.includes('telemetry')) {
        console.error('Error loading TradingView chart:', error);
      }
      setIsChartLoaded(true);
    }
    
    // Note: TradingView widget may send 'report' requests that get blocked by ad-blockers.
    // This is normal and doesn't affect chart functionality. Errors are now suppressed.
  }, [selectedSymbol, timeframe]);

  return (
    <Card className="h-full">
      <CardHeader className={`${isMobile ? 'pb-1 px-2 pt-2' : 'pb-3'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
          <div className={`${isMobile ? 'w-full text-center' : ''}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
              {selectedSymbol}
            </CardTitle>
            <div className={`flex items-center ${isMobile ? 'justify-center space-x-1' : 'space-x-3'} space-x-reverse mt-1`}>
              <span className={`${isMobile ? 'text-sm' : 'text-2xl'} font-bold text-green-600`}>
                ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '109,384.00'}
              </span>
              <Badge className={`${priceChange >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white ${isMobile ? 'text-[8px] px-1 py-0' : ''}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
              <Badge variant="outline" className={`text-blue-600 border-blue-600 ${isMobile ? 'text-[8px] px-1 py-0' : ''}`}>
                مباشر
              </Badge>
            </div>
          </div>

          {/* أزرار الإطار الزمني */}
          <div className={`flex ${isMobile ? 'space-x-0.5 justify-center w-full' : 'space-x-2'} space-x-reverse`}>
            {['15m', '1h', '4h', '1D', '1W'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => setTimeframe(tf)}
                className={isMobile ? 'text-[8px] px-1 py-1 h-6 min-w-0' : ''}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Phase 2.2: Signal toggle controls */}
        {latestSignal && (
          <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center justify-end space-x-2'} space-x-reverse mt-2`}>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex items-center space-x-1 space-x-reverse">
                {showAISignals ? (
                  <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                <span className={`${isMobile ? 'text-[8px]' : 'text-xs'} text-gray-600 dark:text-gray-400`}>AI</span>
                <Switch
                  checked={showAISignals}
                  onCheckedChange={setShowAISignals}
                  className={isMobile ? 'scale-75' : ''}
                />
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {showTradingViewSignals ? (
                  <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                <span className={`${isMobile ? 'text-[8px]' : 'text-xs'} text-gray-600 dark:text-gray-400`}>TV</span>
                <Switch
                  checked={showTradingViewSignals}
                  onCheckedChange={setShowTradingViewSignals}
                  className={isMobile ? 'scale-75' : ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* أزرار الأزواج الشائعة */}
        <div className={`flex ${isMobile ? 'space-x-0.5 overflow-x-auto pb-1' : 'space-x-2'} space-x-reverse mt-2`}>
          {popularPairs.map((pair) => (
            <Button
              key={pair}
              variant={selectedSymbol === pair ? "default" : "outline"}
              size="sm"
              onClick={() => onSymbolChange(pair)}
              className={isMobile ? 'text-[8px] px-1 py-1 h-6 flex-shrink-0 min-w-0' : ''}
            >
              {pair.split('/')[0]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={`relative ${isMobile ? 'h-[200px]' : 'h-[500px]'} w-full`}>
          {!isChartLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className={`${isMobile ? 'text-[8px]' : 'text-sm'} text-gray-600 dark:text-gray-400`}>جاري تحميل الشارت...</p>
              </div>
            </div>
          )}
          <div 
            ref={chartContainerRef} 
            className="h-full w-full"
            style={{ minHeight: isMobile ? '200px' : '500px' }}
          />
          
          {/* Phase 2.2: Overlay signals on chart */}
          {isChartLoaded && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* User-defined TP/SL lines */}
              {takeProfitPrice && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-green-500 bg-green-500/10"
                  style={{ 
                    top: '30%',
                    height: '2px'
                  }}
                >
                  <span className={`absolute right-2 -top-6 bg-green-500 text-white px-1 py-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} rounded`}>
                    جني: ${takeProfitPrice.toFixed(2)}
                  </span>
                </div>
              )}
              {stopLossPrice && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 bg-red-500/10"
                  style={{ 
                    top: '70%',
                    height: '2px'
                  }}
                >
                  <span className={`absolute right-2 -top-6 bg-red-500 text-white px-1 py-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} rounded`}>
                    وقف: ${stopLossPrice.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Signal overlays */}
              {latestSignal && (
                <>
                  {/* Show AI signals */}
                  {showAISignals && (latestSignal.source === 'ai' || latestSignal.source === 'enhanced') && (
                    <>
                      {/* Entry arrow marker */}
                      <div
                        className={`absolute ${latestSignal.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}`}
                        style={{
                          left: '10%',
                          top: latestSignal.direction === 'BUY' ? '40%' : '60%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <Sparkles className={`w-6 h-6 ${latestSignal.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}`} />
                          <Badge 
                            variant="outline" 
                            className={`mt-1 ${latestSignal.direction === 'BUY' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} ${isMobile ? 'text-[8px]' : 'text-xs'}`}
                          >
                            {latestSignal.direction} {latestSignal.confidence.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>

                      {/* SL line */}
                      {latestSignal.stopLossPrice && (
                        <div 
                          className={`absolute left-0 right-0 border-t-2 ${latestSignal.direction === 'BUY' ? 'border-red-500' : 'border-green-500'} opacity-50`}
                          style={{ 
                            top: '65%',
                            height: '2px'
                          }}
                        >
                          <span className={`absolute right-2 -top-6 ${latestSignal.direction === 'BUY' ? 'bg-red-500' : 'bg-green-500'} text-white px-1 py-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} rounded`}>
                            SL: ${latestSignal.stopLossPrice.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* TP line */}
                      {latestSignal.takeProfitPrice && (
                        <div 
                          className={`absolute left-0 right-0 border-t-2 ${latestSignal.direction === 'BUY' ? 'border-green-500' : 'border-red-500'} opacity-50`}
                          style={{ 
                            top: '25%',
                            height: '2px'
                          }}
                        >
                          <span className={`absolute right-2 -top-6 ${latestSignal.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'} text-white px-1 py-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} rounded`}>
                            TP: ${latestSignal.takeProfitPrice.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Show TradingView signals */}
                  {showTradingViewSignals && latestSignal.source === 'tradingview' && (
                    <>
                      {/* Entry arrow marker */}
                      <div
                        className={`absolute ${latestSignal.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}`}
                        style={{
                          left: '10%',
                          top: latestSignal.direction === 'BUY' ? '40%' : '60%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <Sparkles className={`w-6 h-6 ${latestSignal.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}`} />
                          <Badge 
                            variant="outline" 
                            className={`mt-1 ${latestSignal.direction === 'BUY' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} ${isMobile ? 'text-[8px]' : 'text-xs'}`}
                          >
                            TV {latestSignal.direction} {latestSignal.confidence.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>

                      {/* SL/TP lines */}
                      {latestSignal.stopLossPrice && (
                        <div 
                          className={`absolute left-0 right-0 border-t-2 ${latestSignal.direction === 'BUY' ? 'border-red-500' : 'border-green-500'} opacity-50`}
                          style={{ 
                            top: '65%',
                            height: '2px'
                          }}
                        />
                      )}
                      {latestSignal.takeProfitPrice && (
                        <div 
                          className={`absolute left-0 right-0 border-t-2 ${latestSignal.direction === 'BUY' ? 'border-green-500' : 'border-red-500'} opacity-50`}
                          style={{ 
                            top: '25%',
                            height: '2px'
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        {(takeProfitPrice || stopLossPrice) && (
          <div className={`${isMobile ? 'p-2' : 'p-4'} border-t bg-gray-50 dark:bg-gray-800`}>
            <div className={`grid grid-cols-2 gap-2 ${isMobile ? 'text-[8px]' : 'text-sm'}`}>
              {takeProfitPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">جني الأرباح:</span>
                  <span className="text-green-600 font-medium">${takeProfitPrice.toFixed(2)}</span>
                </div>
              )}
              {stopLossPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">وقف الخسائر:</span>
                  <span className="text-red-600 font-medium">${stopLossPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
