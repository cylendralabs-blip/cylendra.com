/**
 * AI Market Bias Panel
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLiveAISignals } from '@/hooks/useLiveAISignals';
import { TrendingUp, TrendingDown, Minus, Activity, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function BiasPanel() {
  const { t } = useTranslation('ai_live');
  const { signals } = useLiveAISignals({ maxSignals: 50 });

  const biasData = useMemo(() => {
    if (signals.length === 0) {
      return {
        trend: 'NEUTRAL' as const,
        confidence: 0,
        buyCount: 0,
        sellCount: 0,
        waitCount: 0,
        avgConfidence: 0,
        volatility: 0
      };
    }

    const buySignals = signals.filter(s => s.side === 'BUY');
    const sellSignals = signals.filter(s => s.side === 'SELL');
    const waitSignals = signals.filter(s => s.side === 'WAIT');

    const totalConfidence = signals.reduce((sum, s) => sum + s.confidence, 0);
    const avgConfidence = totalConfidence / signals.length;

    // Calculate volatility (standard deviation of confidence)
    const variance = signals.reduce((sum, s) => {
      const diff = s.confidence - avgConfidence;
      return sum + (diff * diff);
    }, 0) / signals.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    const buyRatio = buySignals.length / signals.length;
    const sellRatio = sellSignals.length / signals.length;

    if (buyRatio > 0.6) {
      trend = 'BULLISH';
    } else if (sellRatio > 0.6) {
      trend = 'BEARISH';
    }

    // Calculate overall confidence
    const trendConfidence = Math.max(buyRatio, sellRatio) * 100;

    return {
      trend,
      confidence: Math.round(trendConfidence),
      buyCount: buySignals.length,
      sellCount: sellSignals.length,
      waitCount: waitSignals.length,
      avgConfidence: Math.round(avgConfidence),
      volatility: Math.round(volatility)
    };
  }, [signals]);

  const getTrendColor = (trend: string) => {
    if (trend === 'BULLISH') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (trend === 'BEARISH') return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'BULLISH') return TrendingUp;
    if (trend === 'BEARISH') return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon(biasData.trend);

  const getTrendLabel = (trend: string) => {
    if (trend === 'BULLISH') return t('bias.bullish');
    if (trend === 'BEARISH') return t('bias.bearish');
    return t('bias.neutral');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('bias.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendIcon className={cn('h-6 w-6',
              biasData.trend === 'BULLISH' ? 'text-green-500' :
                biasData.trend === 'BEARISH' ? 'text-red-500' :
                  'text-gray-500'
            )} />
            <span className="text-lg font-semibold">
              {getTrendLabel(biasData.trend)}
            </span>
          </div>
          <Badge className={getTrendColor(biasData.trend)}>
            {biasData.confidence}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('bias.avg_confidence')}</span>
            <span className="font-semibold">{biasData.avgConfidence}%</span>
          </div>
          <Progress value={biasData.avgConfidence} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-500">{biasData.buyCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('bias.buy')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-500">{biasData.sellCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('bias.sell')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
            <div className="text-2xl font-bold text-gray-500">{biasData.waitCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('bias.wait')}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {t('bias.volatility')}
            </span>
            <span className="font-semibold">{biasData.volatility}%</span>
          </div>
          <Progress value={biasData.volatility} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {t('bias.sample_info', { count: signals.length })}
        </div>
      </CardContent>
    </Card>
  );
}

