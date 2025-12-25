/**
 * AI Analysis Panel Component
 * 
 * Displays AI-powered insights for backtest results
 * 
 * Phase 4: Advanced Features - Task 1
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBacktestAIAnalysis } from '@/hooks/useBacktestAI';
import type { AIAnalysisResult } from '@/services/backtest/aiAnalysis';

interface AIAnalysisPanelProps {
  runId: string;
}

export function AIAnalysisPanel({ runId }: AIAnalysisPanelProps) {
  const { data: analysis, isLoading, error } = useBacktestAIAnalysis(runId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Backtest Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground">Generating AI analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Backtest Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI analysis is temporarily unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Backtest Insights
          </CardTitle>
          <Badge variant="outline">
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Summary</h3>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Strengths
            </h3>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {analysis.weaknesses.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Weaknesses
            </h3>
            <ul className="space-y-1">
              {analysis.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Recommendations
            </h3>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Conditions */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Market Conditions</h3>
          <p className="text-sm text-muted-foreground">{analysis.marketConditions}</p>
        </div>

        {/* Risk Assessment */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Risk Assessment</h3>
          <p className="text-sm text-muted-foreground">{analysis.riskAssessment}</p>
        </div>
      </CardContent>
    </Card>
  );
}

