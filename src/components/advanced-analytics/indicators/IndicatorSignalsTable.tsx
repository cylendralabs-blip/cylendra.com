/**
 * Indicator Signals Table Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { SignalAnalyticsRow } from '@/hooks/useAdvancedIndicatorAnalytics';
import { formatDistanceToNow } from 'date-fns';

interface IndicatorSignalsTableProps {
  signals: SignalAnalyticsRow[];
  onSignalClick: (signal: SignalAnalyticsRow) => void;
}

export function IndicatorSignalsTable({
  signals,
  onSignalClick
}: IndicatorSignalsTableProps) {
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

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '-';
    return score.toFixed(1);
  };

  if (signals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            لا توجد إشارات متاحة للعرض
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>جدول الإشارات مع تفاصيل المؤشرات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الإطار</TableHead>
                <TableHead>الاتجاه</TableHead>
                <TableHead>AI</TableHead>
                <TableHead>Technical</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Wave</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>النتيجة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signals.map((signal) => (
                <TableRow key={signal.id}>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(signal.created_at), {
                      addSuffix: true
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{signal.symbol}</TableCell>
                  <TableCell>{signal.timeframe}</TableCell>
                  <TableCell>
                    <Badge className={getSideColor(signal.side)}>
                      {signal.side}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatScore(signal.ai_score)}</TableCell>
                  <TableCell>{formatScore(signal.technical_score)}</TableCell>
                  <TableCell>{formatScore(signal.volume_score)}</TableCell>
                  <TableCell>{formatScore(signal.pattern_score)}</TableCell>
                  <TableCell>{formatScore(signal.wave_score)}</TableCell>
                  <TableCell>{formatScore(signal.sentiment_score)}</TableCell>
                  <TableCell>
                    <Badge className={getConfidenceColor(signal.final_confidence)}>
                      {signal.final_confidence.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {signal.profit_loss_percentage !== null ? (
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
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSignalClick(signal)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

