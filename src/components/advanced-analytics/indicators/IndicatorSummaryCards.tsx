/**
 * Indicator Summary Cards Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndicatorSummary } from '@/hooks/useAdvancedIndicatorAnalytics';
import { Brain, TrendingUp, BarChart3, Shapes, Waves, Heart, Target } from 'lucide-react';

interface IndicatorSummaryCardsProps {
  summary: IndicatorSummary;
}

export function IndicatorSummaryCards({ summary }: IndicatorSummaryCardsProps) {
  const cards = [
    {
      title: 'AI Score',
      value: summary.avg_ai_score,
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Technical Score',
      value: summary.avg_technical_score,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Volume Score',
      value: summary.avg_volume_score,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Pattern Score',
      value: summary.avg_pattern_score,
      icon: Shapes,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Wave Score',
      value: summary.avg_wave_score,
      icon: Waves,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
      title: 'Sentiment Score',
      value: summary.avg_sentiment_score,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      title: 'Confidence',
      value: summary.avg_confidence,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">متوسط القيمة</p>
            </CardContent>
          </Card>
        );
      })}

      {/* Signal Strength Distribution */}
      <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            توزيع القوة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">قوية</span>
              <span className="text-sm font-semibold text-green-600">
                {summary.count_strong}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">متوسطة</span>
              <span className="text-sm font-semibold text-yellow-600">
                {summary.count_medium}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">ضعيفة</span>
              <span className="text-sm font-semibold text-red-600">
                {summary.count_weak}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  الإجمالي
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {summary.count_signals}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

