/**
 * Technical Summary Widget
 * 
 * Phase 2.4: Display technical analysis summary in Smart Trade
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTechnicalSummary } from '@/hooks/useTechnicalSummary';
import { Loader2, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface TechnicalSummaryWidgetProps {
  symbol: string;
  timeframe: string;
  platform?: string;
}

export function TechnicalSummaryWidget({ 
  symbol, 
  timeframe, 
  platform 
}: TechnicalSummaryWidgetProps) {
  const { data: summary, isLoading, error } = useTechnicalSummary(
    symbol,
    timeframe,
    platform,
    { enabled: !!symbol && !!timeframe }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Technical Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Technical Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500 text-center py-2">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'BULLISH') return 'text-green-600 bg-green-500/10 border-green-500/30';
    if (trend === 'BEARISH') return 'text-red-600 bg-red-500/10 border-red-500/30';
    return 'text-gray-600 bg-gray-500/10 border-gray-500/30';
  };

  const getRSIColor = (status: string) => {
    if (status === 'OVERBOUGHT') return 'text-red-600';
    if (status === 'OVERSOLD') return 'text-green-600';
    return 'text-gray-600';
  };

  const getMACDColor = (alignment: string) => {
    if (alignment === 'BULLISH') return 'text-green-600';
    if (alignment === 'BEARISH') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Technical Summary
          </div>
          <Badge 
            variant="outline" 
            className={getTrendColor(summary.overallSignal)}
          >
            {summary.overallSignal}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Trend */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">Trend:</span>
          <div className="flex items-center gap-1">
            {summary.trend === 'BULLISH' && <TrendingUp className="w-3 h-3 text-green-600" />}
            {summary.trend === 'BEARISH' && <TrendingDown className="w-3 h-3 text-red-600" />}
            {summary.trend === 'RANGING' && <Minus className="w-3 h-3 text-gray-600" />}
            <span className={`text-xs font-medium ${getTrendColor(summary.trend).split(' ')[0]}`}>
              {summary.trend}
            </span>
          </div>
        </div>

        {/* RSI Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">RSI:</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getRSIColor(summary.rsiStatus)}`}>
              {summary.indicators.rsi.toFixed(1)}
            </span>
            <Badge variant="outline" className={`text-[8px] ${getRSIColor(summary.rsiStatus)}`}>
              {summary.rsiStatus}
            </Badge>
          </div>
        </div>

        {/* MACD Alignment */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">MACD:</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getMACDColor(summary.macdAlignment)}`}>
              {summary.macdAlignment}
            </span>
            {summary.indicators.macd.histogram > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
          </div>
        </div>

        {/* EMA Position */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">EMA:</span>
          <span className="text-xs text-gray-600">
            {summary.indicators.ema20 > summary.indicators.ema50 ? '20 > 50' : '20 < 50'}
          </span>
        </div>

        {/* ADX Trend Strength */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">ADX:</span>
          <Badge 
            variant="outline" 
            className={`text-[8px] ${
              summary.indicators.adx.trend_strength === 'STRONG' ? 'text-green-600' :
              summary.indicators.adx.trend_strength === 'MODERATE' ? 'text-yellow-600' :
              'text-gray-600'
            }`}
          >
            {summary.indicators.adx.trend_strength} ({summary.indicators.adx.value.toFixed(1)})
          </Badge>
        </div>

        {/* Confidence */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
            <Badge 
              variant="outline" 
              className={`text-[8px] ${
                summary.confidence >= 70 ? 'text-green-600' :
                summary.confidence >= 50 ? 'text-yellow-600' :
                'text-gray-600'
              }`}
            >
              {summary.confidence.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

