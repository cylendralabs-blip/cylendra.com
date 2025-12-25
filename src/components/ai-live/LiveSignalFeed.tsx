/**
 * Live Signal Feed Component
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveAISignals } from '@/hooks/useLiveAISignals';
import type { ParsedLiveSignal } from '@/core/ai-live';
import { formatDistanceToNow } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { ArrowUp, ArrowDown, Activity, Volume2, TrendingUp, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoTradeBadge } from './AutoTradeBadge';
import { useTranslation } from 'react-i18next';

interface LiveSignalFeedProps {
  minStrength?: 'WEAK' | 'MODERATE' | 'STRONG';
  symbolFilter?: string;
  timeframeFilter?: string;
  sideFilter?: 'BUY' | 'SELL';
  maxSignals?: number;
  onSignalClick?: (signal: ParsedLiveSignal) => void;
}

export function LiveSignalFeed({
  minStrength = 'WEAK',
  symbolFilter,
  timeframeFilter,
  sideFilter,
  maxSignals = 50,
  onSignalClick
}: LiveSignalFeedProps) {
  const { t, i18n } = useTranslation('ai_live');
  const locale = i18n.language === 'ar' ? arSA : enUS;

  const { signals, isConnected } = useLiveAISignals({
    minStrength,
    symbol: symbolFilter,
    timeframe: timeframeFilter,
    side: sideFilter,
    maxSignals,
    onNewSignal: (signal) => {
      // Play sound notification for strong signals
      if (signal.strength === 'STRONG' && signal.side !== 'WAIT') {
        // Optional: play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => { });
        } catch (e) {
          // Ignore audio errors
        }
      }
    }
  });

  const getSideColor = (side: string) => {
    if (side === 'BUY') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (side === 'SELL') return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  };

  const getStrengthColor = (strength: string) => {
    if (strength === 'STRONG') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (strength === 'MODERATE') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-emerald-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className={cn('h-5 w-5', isConnected ? 'text-green-500 animate-pulse' : 'text-gray-500')} />
            {t('feed.title')}
          </CardTitle>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? t('feed.connected') : t('feed.disconnected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {signals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('feed.no_signals')}</p>
                {!isConnected && <p className="text-sm mt-2">{t('feed.connecting')}</p>}
              </div>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer',
                    signal.side === 'BUY' ? 'border-green-500/20 bg-green-500/5' :
                      signal.side === 'SELL' ? 'border-red-500/20 bg-red-500/5' :
                        'border-gray-500/20 bg-gray-500/5'
                  )}
                  onClick={() => onSignalClick?.(signal)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn('font-semibold', getSideColor(signal.side))}>
                        {signal.side === 'BUY' ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : signal.side === 'SELL' ? (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        ) : null}
                        {signal.side === 'BUY' ? t('filters.buy') : signal.side === 'SELL' ? t('filters.sell') : signal.side}
                      </Badge>
                      <Badge variant="outline" className={getStrengthColor(signal.strength)}>
                        {signal.strength === 'STRONG' ? t('feed.strong') :
                          signal.strength === 'MODERATE' ? t('feed.moderate') : t('feed.weak')}
                      </Badge>
                      {/* Phase Y: Auto Trade Badge */}
                      <AutoTradeBadge signal={signal} />
                    </div>
                    <span className={cn('text-sm font-bold', getConfidenceColor(signal.confidence))}>
                      {signal.confidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-lg">{signal.symbol}</span>
                      <span className="text-sm text-muted-foreground ml-2">{signal.timeframe}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true, locale })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Brain className="h-3 w-3 text-purple-400" />
                      <span className="text-muted-foreground">{t('feed.ai_score_short')}:</span>
                      <span className="font-semibold">{signal.aiScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-blue-400" />
                      <span className="text-muted-foreground">{t('feed.technical_score_short')}:</span>
                      <span className="font-semibold">{signal.technicalScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Volume2 className="h-3 w-3 text-orange-400" />
                      <span className="text-muted-foreground">{t('feed.volume_score_short')}:</span>
                      <span className="font-semibold">{signal.volumeScore}</span>
                    </div>
                  </div>

                  {signal.entryPrice && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t('feed.entry')}:</span>
                        <span className="font-semibold">${signal.entryPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                        {signal.stopLoss && (
                          <>
                            <span className="text-muted-foreground">{t('feed.stop_loss')}:</span>
                            <span className="font-semibold text-red-400">${signal.stopLoss.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                          </>
                        )}
                        {signal.takeProfit && (
                          <>
                            <span className="text-muted-foreground">{t('feed.take_profit')}:</span>
                            <span className="font-semibold text-green-400">${signal.takeProfit.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
