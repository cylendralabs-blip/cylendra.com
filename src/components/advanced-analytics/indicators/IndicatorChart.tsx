/**
 * Indicator Chart Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { IndicatorSummary } from '@/hooks/useAdvancedIndicatorAnalytics';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';

interface IndicatorChartProps {
  summary: IndicatorSummary;
}

type ChartType = 'bar' | 'radar';

export function IndicatorChart({ summary }: IndicatorChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const chartData = [
    {
      name: 'AI',
      value: summary.avg_ai_score,
      fullMark: 100
    },
    {
      name: 'Technical',
      value: summary.avg_technical_score,
      fullMark: 100
    },
    {
      name: 'Volume',
      value: summary.avg_volume_score,
      fullMark: 100
    },
    {
      name: 'Pattern',
      value: summary.avg_pattern_score,
      fullMark: 100
    },
    {
      name: 'Wave',
      value: summary.avg_wave_score,
      fullMark: 100
    },
    {
      name: 'Sentiment',
      value: summary.avg_sentiment_score,
      fullMark: 100
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>خريطة المؤشرات</CardTitle>
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
                <Legend />
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
                  name="متوسط القيمة"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

