/**
 * TradingView Chart with Auto Trades Overlay
 * 
 * Phase: Trade Chart Overlay
 * Shows auto trades markers on TradingView chart
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAutoTradesChart, type AutoTradeChartData } from '@/hooks/useAutoTradesChart';
import { AutoTradeDetailsDrawer } from '@/components/auto-trades/AutoTradeDetailsDrawer';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown,
  X,
  CheckCircle2
} from 'lucide-react';
import type { AutoTrade } from '@/hooks/useAutoTrades';

interface AutoTradesChartProps {
  selectedSymbol: string;
  timeframe?: string;
  onSymbolChange?: (symbol: string) => void;
}

export const AutoTradesChart = ({ 
  selectedSymbol, 
  timeframe = '1h',
  onSymbolChange 
}: AutoTradesChartProps) => {
  const { subscribeToSymbol, getPrice } = useRealTimePrices();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [isChartLoaded, setIsChartLoaded] = useState(false);
  
  // Load showAutoTrades from localStorage on mount
  const [showAutoTrades, setShowAutoTrades] = useState(() => {
    const saved = localStorage.getItem('showAutoTrades');
    return saved === 'true';
  });
  
  const [selectedAutoTrade, setSelectedAutoTrade] = useState<AutoTrade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  // Save showAutoTrades to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('showAutoTrades', showAutoTrades.toString());
  }, [showAutoTrades]);

  // Normalize pair for query (BTC/USDT -> BTCUSDT)
  const normalizedPair = selectedSymbol.replace('/', '').toUpperCase();

  // Fetch auto trades for chart overlay
  const { data: autoTrades = [], isLoading: tradesLoading } = useAutoTradesChart({
    pair: normalizedPair,
    timeframe: chartTimeframe,
    limit: 200,
    enabled: showAutoTrades && !!selectedSymbol
  });

  // Subscribe to real-time prices
  useEffect(() => {
    const unsubscribe = subscribeToSymbol(selectedSymbol, (priceData) => {
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h);
    });

    const existingPrice = getPrice(selectedSymbol);
    if (existingPrice) {
      setCurrentPrice(existingPrice.price);
      setPriceChange(existingPrice.change24h);
    }

    return unsubscribe;
  }, [selectedSymbol, subscribeToSymbol, getPrice]);

  // Convert symbol to TradingView format
  const convertToTradingViewSymbol = (symbol: string) => {
    const symbolMap: {[key: string]: string} = {
      'BTC/USDT': 'BINANCE:BTCUSDT',
      'ETH/USDT': 'BINANCE:ETHUSDT',
      'BNB/USDT': 'BINANCE:BNBUSDT',
      'ADA/USDT': 'BINANCE:ADAUSDT',
      'SOL/USDT': 'BINANCE:SOLUSDT',
      'XRP/USDT': 'BINANCE:XRPUSDT',
      'DOGE/USDT': 'BINANCE:DOGEUSDT',
      'DOT/USDT': 'BINANCE:DOTUSDT'
    };
    return symbolMap[symbol] || `BINANCE:${symbol.replace('/', '')}`;
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

  // Load TradingView chart
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    try {
      const iframe = document.createElement('iframe');
      const symbol = convertToTradingViewSymbol(selectedSymbol);
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbol}&interval=${chartTimeframe}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&hideideas=1&theme=${theme}&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=ar&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`;
      
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
      
      iframe.onload = () => {
        setIsChartLoaded(true);
      };

      const fallbackTimer = setTimeout(() => {
        setIsChartLoaded(true);
      }, 2000);

      return () => {
        clearTimeout(fallbackTimer);
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
  }, [selectedSymbol, chartTimeframe]);

  const handleTradeMarkerClick = async (trade: AutoTradeChartData) => {
    // Fetch full auto trade data
    const { data } = await (supabase as any)
      .from('auto_trades')
      .select('*')
      .eq('id', trade.id)
      .single();

    if (data) {
      setSelectedAutoTrade(data as AutoTrade);
      setIsDrawerOpen(true);
    }
  };

  // Calculate marker positions (simplified - would need actual price-to-pixel conversion in real implementation)
  const getMarkerPosition = (price: number, minPrice: number, maxPrice: number) => {
    if (maxPrice === minPrice) return 50; // Center if no range
    return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
  };

  // Get price range from auto trades
  const priceRange = autoTrades.length > 0 ? {
    min: Math.min(...autoTrades.map(t => t.entry_price).filter(Boolean)),
    max: Math.max(...autoTrades.map(t => t.entry_price).filter(Boolean))
  } : { min: currentPrice * 0.9, max: currentPrice * 1.1 };

  return (
    <>
      <Card>
        <CardHeader className={`${isMobile ? 'pb-1 px-2 pt-2' : 'pb-3'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
            <div className={`${isMobile ? 'w-full text-center' : ''}`}>
              <CardTitle className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                {selectedSymbol}
              </CardTitle>
              <div className={`flex items-center ${isMobile ? 'justify-center space-x-1' : 'space-x-3'} space-x-reverse mt-1`}>
                <span className={`${isMobile ? 'text-sm' : 'text-2xl'} font-bold text-green-600`}>
                  ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </span>
                <Badge className={`${priceChange >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white ${isMobile ? 'text-[8px] px-1 py-0' : ''}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </Badge>
              </div>
            </div>

            {/* Chart Controls */}
            <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-center' : ''}`}>
              {/* Show Auto Trades Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="show-auto-trades"
                  checked={showAutoTrades}
                  onCheckedChange={setShowAutoTrades}
                />
                <Label htmlFor="show-auto-trades" className="text-sm cursor-pointer">
                  عرض الصفقات التلقائية
                </Label>
              </div>

              {/* Timeframe Buttons */}
              <div className={`flex ${isMobile ? 'space-x-0.5' : 'space-x-2'} space-x-reverse`}>
                {['15m', '1h', '4h', '1D', '1W'].map((tf) => (
                  <Button
                    key={tf}
                    variant={chartTimeframe === tf ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartTimeframe(tf)}
                    className={isMobile ? 'text-[8px] px-1 py-1 h-6 min-w-0' : ''}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`relative ${isMobile ? 'h-[200px]' : 'h-[500px]'} w-full`}>
            {/* Loading State */}
            {!isChartLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className={`${isMobile ? 'text-[8px]' : 'text-sm'} text-gray-600 dark:text-gray-400`}>جاري تحميل الشارت...</p>
                </div>
              </div>
            )}

            {/* TradingView Chart Container */}
            <div 
              ref={chartContainerRef} 
              className="h-full w-full"
              style={{ minHeight: isMobile ? '200px' : '500px' }}
            />

            {/* Auto Trades Overlay */}
            {showAutoTrades && isChartLoaded && (
              <div 
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none z-20"
              >
                {tradesLoading ? (
                  <div className="absolute top-2 right-2 bg-background/80 p-2 rounded text-xs">
                    جاري تحميل الصفقات...
                  </div>
                ) : (
                  <>
                    {/* Entry Markers */}
                    {autoTrades.map((trade) => {
                      const entryY = getMarkerPosition(trade.entry_price, priceRange.min, priceRange.max);
                      
                      return (
                        <div key={trade.id}>
                          {/* Entry Point Marker */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    left: '10%', // Simplified - would need actual time-to-x conversion
                                    top: `${entryY}%`,
                                  }}
                                  onClick={() => handleTradeMarkerClick(trade)}
                                >
                                  {trade.direction === 'long' ? (
                                    <ArrowUp className={`h-5 w-5 ${trade.pnl && trade.pnl > 0 ? 'text-green-500' : trade.pnl && trade.pnl < 0 ? 'text-red-500' : 'text-blue-500'}`} />
                                  ) : (
                                    <ArrowDown className={`h-5 w-5 ${trade.pnl && trade.pnl > 0 ? 'text-green-500' : trade.pnl && trade.pnl < 0 ? 'text-red-500' : 'text-blue-500'}`} />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <div><strong>Entry:</strong> ${trade.entry_price.toFixed(2)}</div>
                                  <div><strong>Direction:</strong> {trade.direction === 'long' ? 'Long' : 'Short'}</div>
                                  <div><strong>Source:</strong> {trade.signal_source}</div>
                                  {trade.pnl !== null && (
                                    <div><strong>P&L:</strong> {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}</div>
                                  )}
                                  <div className="text-[10px] text-muted-foreground">Click for details</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Exit Point Marker (if exists) */}
                          {trade.exit_price && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      left: '90%', // Simplified
                                      top: `${getMarkerPosition(trade.exit_price, priceRange.min, priceRange.max)}%`,
                                    }}
                                    onClick={() => handleTradeMarkerClick(trade)}
                                  >
                                    {trade.pnl && trade.pnl > 0 ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    <div><strong>Exit:</strong> ${trade.exit_price.toFixed(2)}</div>
                                    {trade.pnl !== null && (
                                      <div><strong>P&L:</strong> {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}</div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* TP Line */}
                          {trade.tp && (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-green-500 opacity-50 pointer-events-none"
                              style={{
                                top: `${getMarkerPosition(trade.tp, priceRange.min, priceRange.max)}%`,
                              }}
                            >
                              <span className="absolute right-2 -top-5 bg-green-500 text-white px-1 py-0.5 text-[10px] rounded">
                                TP: ${trade.tp.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {/* SL Line */}
                          {trade.sl && (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-red-500 opacity-50 pointer-events-none"
                              style={{
                                top: `${getMarkerPosition(trade.sl, priceRange.min, priceRange.max)}%`,
                              }}
                            >
                              <span className="absolute right-2 -top-5 bg-red-500 text-white px-1 py-0.5 text-[10px] rounded">
                                SL: ${trade.sl.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {/* DCA Levels */}
                          {trade.dca_levels && trade.dca_levels.map((dcaPrice, index) => (
                            <div
                              key={`dca-${trade.id}-${index}`}
                              className="absolute left-0 right-0 border-t border-dashed border-blue-400 opacity-30 pointer-events-none"
                              style={{
                                top: `${getMarkerPosition(dcaPrice, priceRange.min, priceRange.max)}%`,
                              }}
                            >
                              <span className="absolute right-2 -top-4 bg-blue-400 text-white px-1 py-0.5 text-[10px] rounded">
                                DCA #{index + 1}: ${dcaPrice.toFixed(2)}
                              </span>
                            </div>
                          ))}

                          {/* Trade Path Line (Entry to Exit) */}
                          {trade.exit_price && (
                            <svg
                              className="absolute inset-0 pointer-events-none"
                              style={{ zIndex: 1 }}
                            >
                              <line
                                x1="10%"
                                y1={`${entryY}%`}
                                x2="90%"
                                y2={`${getMarkerPosition(trade.exit_price, priceRange.min, priceRange.max)}%`}
                                stroke={trade.pnl && trade.pnl > 0 ? '#10b981' : '#ef4444'}
                                strokeWidth="1"
                                strokeDasharray="4,4"
                                opacity="0.5"
                              />
                            </svg>
                          )}
                        </div>
                      );
                    })}

                    {/* Legend */}
                    {autoTrades.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-background/90 p-2 rounded text-xs space-y-1 border">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3 text-blue-500" />
                          <span>Long Entry</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3 text-blue-500" />
                          <span>Short Entry</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 border-t-2 border-green-500" />
                          <span>Take Profit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 border-t-2 border-red-500" />
                          <span>Stop Loss</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 border-t border-dashed border-blue-400" />
                          <span>DCA Level</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto Trade Details Drawer */}
      <AutoTradeDetailsDrawer
        autoTrade={selectedAutoTrade}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </>
  );
};

