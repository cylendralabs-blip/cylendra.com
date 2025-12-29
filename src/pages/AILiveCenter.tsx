/**
 * AI Live Center Page
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { useState, useEffect } from 'react';
import { LiveSignalFeed } from '@/components/ai-live/LiveSignalFeed';
import { LiveCharts } from '@/components/ai-live/LiveCharts';
import { AutoTradesChart } from '@/components/ai-live/AutoTradesChart';
import { SmartTape } from '@/components/ai-live/SmartTape';
import { BiasPanel } from '@/components/ai-live/BiasPanel';
import AutoTradingPanel from '@/components/ai-live/AutoTradingPanel';
import { RecentAutoTradesPanel } from '@/components/ai-live/RecentAutoTradesPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RefreshCw, Settings, Filter } from 'lucide-react';
import type { ParsedLiveSignal } from '@/core/ai-live';
import { format } from 'date-fns';
import { useUserPlan } from '@/hooks/useUserPlan';
import { canUseFeature } from '@/core/plans/planManager';
import { FeatureLock } from '@/components/plans/FeatureLock';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { arSA, enUS } from 'date-fns/locale';

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'DOT/USDT'];
const TIMEFRAMES = ['1m', '3m', '5m', '15m', '1h', '4h', '1d'];

export default function AILiveCenter() {
  const { t, i18n } = useTranslation('ai_live');
  const { user } = useAuth();
  const { data: userPlan } = useUserPlan();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | undefined>();
  const [selectedSide, setSelectedSide] = useState<'BUY' | 'SELL' | undefined>();
  const [minStrength, setMinStrength] = useState<'WEAK' | 'MODERATE' | 'STRONG'>('WEAK');
  const [selectedSignal, setSelectedSignal] = useState<ParsedLiveSignal | null>(null);

  // Phase X.10: Check feature access
  useEffect(() => {
    if (user?.id) {
      canUseFeature(user.id, 'ai.live_center').then(setCanAccess);
    }
  }, [user?.id]);

  // Show feature lock if not allowed
  if (canAccess === false) {
    return (
      <div className="container mx-auto p-6">
        <FeatureLock
          featureName={t('access.feature_name')}
          requiredPlan="PREMIUM"
          currentPlan={userPlan?.code}
          description={t('access.description')}
        />
      </div>
    );
  }

  // Show loading while checking
  if (canAccess === null) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
            <p className="text-gray-600 dark:text-gray-400">{t('access.checking')}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSignalClick = (signal: ParsedLiveSignal) => {
    setSelectedSignal(signal);
  };

  const clearFilters = () => {
    setSelectedSymbol(undefined);
    setSelectedTimeframe(undefined);
    setSelectedSide(undefined);
    setMinStrength('WEAK');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {t('badge')}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.symbol')}</label>
              <span className="sr-only">Symbol</span>
              <Select value={selectedSymbol || 'all'} onValueChange={(value) => setSelectedSymbol(value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.all_symbols')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_symbols')}</SelectItem>
                  {SYMBOLS.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.timeframe')}</label>
              <Select value={selectedTimeframe || 'all'} onValueChange={(value) => setSelectedTimeframe(value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.all_timeframes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_timeframes')}</SelectItem>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.side')}</label>
              <Select value={selectedSide || 'all'} onValueChange={(value) => setSelectedSide(value === 'all' ? undefined : value as 'BUY' | 'SELL')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.all_sides')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_sides')}</SelectItem>
                  <SelectItem value="BUY">{t('filters.buy')}</SelectItem>
                  <SelectItem value="SELL">{t('filters.sell')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.min_strength')}</label>
              <Select value={minStrength} onValueChange={(value) => setMinStrength(value as 'WEAK' | 'MODERATE' | 'STRONG')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEAK">{t('filters.weak')}</SelectItem>
                  <SelectItem value="MODERATE">{t('filters.moderate')}</SelectItem>
                  <SelectItem value="STRONG">{t('filters.strong')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('filters.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart, Charts & Live Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart at the top */}
          <AutoTradesChart
            selectedSymbol={selectedSymbol || 'BTC/USDT'}
            timeframe={selectedTimeframe || '1h'}
            onSymbolChange={(symbol) => setSelectedSymbol(symbol)}
          />
          {/* Live Charts below chart */}
          <LiveCharts />
          {/* Live Signal Feed at the bottom */}
          <LiveSignalFeed
            minStrength={minStrength}
            symbolFilter={selectedSymbol}
            timeframeFilter={selectedTimeframe}
            sideFilter={selectedSide}
            onSignalClick={handleSignalClick}
          />
        </div>

        {/* Right Column - Side Panels */}
        <div className="space-y-6">
          <AutoTradingPanel />
          <RecentAutoTradesPanel />
          <BiasPanel />
          <SmartTape />
        </div>
      </div>

      {/* Signal Details Sheet */}
      <Sheet open={!!selectedSignal} onOpenChange={(open) => !open && setSelectedSignal(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('details.title')}</SheetTitle>
            <SheetDescription>
              {t('details.description')}
            </SheetDescription>
          </SheetHeader>

          {selectedSignal && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.symbol')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.symbol}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.timeframe')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.timeframe}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.side')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.side === 'BUY' ? t('filters.buy') : selectedSignal.side === 'SELL' ? t('filters.sell') : selectedSignal.side}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.confidence')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.confidence}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.strength')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.strength === 'STRONG' ? t('feed.strong') : selectedSignal.strength === 'MODERATE' ? t('feed.moderate') : t('feed.weak')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('details.risk_level')}</div>
                  <div className="text-lg font-semibold">{selectedSignal.riskLevel}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">{t('details.indicators')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.ai_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.aiScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.technical_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.technicalScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.volume_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.volumeScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.pattern_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.patternScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.wave_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.waveScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('details.sentiment_score')}</div>
                    <div className="text-lg font-semibold">{selectedSignal.sentimentScore}</div>
                  </div>
                </div>
              </div>

              {selectedSignal.entryPrice && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">{t('details.price_levels')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('details.entry')}</div>
                      <div className="text-lg font-semibold">${selectedSignal.entryPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
                    </div>
                    {selectedSignal.stopLoss && (
                      <div>
                        <div className="text-sm text-muted-foreground">{t('details.stop_loss')}</div>
                        <div className="text-lg font-semibold text-red-400">${selectedSignal.stopLoss.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
                      </div>
                    )}
                    {selectedSignal.takeProfit && (
                      <div>
                        <div className="text-sm text-muted-foreground">{t('details.take_profit')}</div>
                        <div className="text-lg font-semibold text-green-400">${selectedSignal.takeProfit.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedSignal.reasoning && selectedSignal.reasoning.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">{t('details.reasoning')}</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedSignal.reasoning.map((reason, index) => (
                      <li key={index} className="text-sm">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">{t('details.time')}</div>
                <div className="text-sm font-semibold">
                  {format(new Date(selectedSignal.timestamp), i18n.language === 'ar' ? 'PPpp' : 'PPpp', { locale: i18n.language === 'ar' ? arSA : enUS })}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

