/**
 * Live Charts Component
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useLiveAISignals } from '@/hooks/useLiveAISignals';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';

type ChartType = 'bar' | 'radar';

export function LiveCharts() {
  const { signals } = useLiveAISignals({ maxSignals: 20 });
  const [chartType, setChartType] = useState<ChartType>('bar');

  const chartData = useMemo(() => {
    if (signals.length === 0) {
      return [
        { name: 'AI', value: 0 },
        { name: 'Technical', value: 0 },
        { name: 'Volume', value: 0 },
        { name: 'Pattern', value: 0 },
        { name: 'Wave', value: 0 },
        { name: 'Sentiment', value: 0 }
      ];
    }

    // Calculate averages from recent signals
    const totals = signals.reduce(
      (acc, signal) => ({
        ai: acc.ai + signal.aiScore,
        technical: acc.technical + signal.technicalScore,
        volume: acc.volume + signal.volumeScore,
        pattern: acc.pattern + signal.patternScore,
        wave: acc.wave + signal.waveScore,
        sentiment: acc.sentiment + signal.sentimentScore
      }),
      { ai: 0, technical: 0, volume: 0, pattern: 0, wave: 0, sentiment: 0 }
    );

    const count = signals.length;

    return [
      {
        name: 'AI',
        value: Math.round(totals.ai / count),
        fullMark: 100
      },
      {
        name: 'Technical',
        value: Math.round(totals.technical / count),
        fullMark: 100
      },
      {
        name: 'Volume',
        value: Math.round(totals.volume / count),
        fullMark: 100
      },
      {
        name: 'Pattern',
        value: Math.round(totals.pattern / count),
        fullMark: 100
      },
      {
        name: 'Wave',
        value: Math.round(totals.wave / count),
        fullMark: 100
      },
      {
        name: 'Sentiment',
        value: Math.round(totals.sentiment / count),
        fullMark: 100
      }
    ];
  }, [signals]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>مخطط المؤشرات اللحظي</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Bar
            </Button>
            <Button
              variant={chartType === 'radar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('radar')}
            >
              <RadarIcon className="w-4 h-4 mr-2" />
              Radar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="متوسط القيمة" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="المؤشرات"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          يعتمد على آخر {signals.length} إشارة
        </div>
      </CardContent>
    </Card>
  );
}

