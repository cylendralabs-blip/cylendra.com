/**
 * Indicator Details Drawer Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, TrendingUp, BarChart3, Shapes, Waves, Heart } from 'lucide-react';
import { SignalAnalyticsRow } from '@/hooks/useAdvancedIndicatorAnalytics';
import { format } from 'date-fns';
import { ReactNode } from 'react';

interface IndicatorDetailsDrawerProps {
  signal: SignalAnalyticsRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LabelValue = ({ label, value }: { label: string; value?: string | number | ReactNode | null }) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-semibold">{value ?? '—'}</span>
  </div>
);

export function IndicatorDetailsDrawer({
  signal,
  open,
  onOpenChange
}: IndicatorDetailsDrawerProps) {
  if (!signal) {
    return null;
  }

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '—';
    return `${score.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getSideColor = (side: string) => {
    return side === 'BUY'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // Parse metadata if available
  const metadata = signal.metadata || {};
  const analysisResult = metadata.analysis_result || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            تفاصيل تحليل المؤشرات
          </SheetTitle>
          <SheetDescription>
            {signal.symbol} • {signal.timeframe} •{' '}
            {signal.side === 'BUY' ? 'شراء' : signal.side === 'SELL' ? 'بيع' : 'انتظار'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-120px)] pr-2">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">معلومات الإشارة</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <LabelValue
                  label="الوقت"
                  value={format(new Date(signal.created_at), 'PPpp')}
                />
                <LabelValue label="الرمز" value={signal.symbol} />
                <LabelValue label="الإطار الزمني" value={signal.timeframe} />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">الاتجاه</span>
                  <Badge className={getSideColor(signal.side)}>{signal.side}</Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">الثقة النهائية</span>
                  <Badge className={getConfidenceColor(signal.final_confidence)}>
                    {signal.final_confidence.toFixed(1)}%
                  </Badge>
                </div>
                {signal.profit_loss_percentage !== null && (
                  <LabelValue
                    label="النتيجة"
                    value={
                      <span
                        className={
                          signal.profit_loss_percentage >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {signal.profit_loss_percentage >= 0 ? '+' : ''}
                        {signal.profit_loss_percentage.toFixed(2)}%
                      </span>
                    }
                  />
                )}
              </div>
            </div>

            <Separator />

            {/* Price Levels */}
            <div>
              <h4 className="text-sm font-semibold mb-3">مستويات الأسعار</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <LabelValue
                  label="سعر الدخول"
                  value={signal.entry_price ? `$${signal.entry_price.toFixed(2)}` : null}
                />
                <LabelValue
                  label="وقف الخسارة"
                  value={signal.stop_loss ? `$${signal.stop_loss.toFixed(2)}` : null}
                />
                <LabelValue
                  label="هدف الربح"
                  value={signal.take_profit ? `$${signal.take_profit.toFixed(2)}` : null}
                />
              </div>
            </div>

            <Separator />

            {/* Indicator Scores */}
            <div>
              <h4 className="text-sm font-semibold mb-3">تفاصيل المؤشرات</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">AI Score</span>
                  </div>
                  <span className="text-lg font-bold">{formatScore(signal.ai_score)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Technical Score</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatScore(signal.technical_score)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Volume Score</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatScore(signal.volume_score)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shapes className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Pattern Score</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatScore(signal.pattern_score)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm font-medium">Wave Score</span>
                  </div>
                  <span className="text-lg font-bold">{formatScore(signal.wave_score)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-medium">Sentiment Score</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatScore(signal.sentiment_score)}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Details from Metadata */}
            {analysisResult.trend && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">تفاصيل التحليل</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {analysisResult.trend && (
                      <LabelValue label="الاتجاه" value={analysisResult.trend} />
                    )}
                    {analysisResult.momentum !== undefined && (
                      <LabelValue
                        label="الزخم"
                        value={`${analysisResult.momentum.toFixed(1)}%`}
                      />
                    )}
                    {analysisResult.volatility !== undefined && (
                      <LabelValue
                        label="التقلب"
                        value={`${analysisResult.volatility.toFixed(1)}%`}
                      />
                    )}
                    {analysisResult.pattern && (
                      <LabelValue label="النمط المكتشف" value={analysisResult.pattern} />
                    )}
                    {analysisResult.wave && (
                      <LabelValue label="الموجة" value={analysisResult.wave} />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reasoning from AI Fusion */}
            {analysisResult.ai_fusion?.reasoning && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">أسباب القرار</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {analysisResult.ai_fusion.reasoning.map((reason: string, idx: number) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

