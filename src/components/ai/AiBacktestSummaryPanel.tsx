/**
 * AI Backtest Summary Panel
 * 
 * Displays AI-generated summary of backtest results
 * Provides insights and suggestions for settings improvements
 * 
 * Phase 11: AI Assistant Integration - Task 8
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildAIContext } from '@/services/ai/contextBuilder';
import { aiClient } from '@/services/ai/aiClient';
import { buildPrompt } from '@/services/ai/prompts';
import { logAIInteraction } from '@/services/ai/aiLogger';
import { AISuggestion } from '@/services/ai/types';

interface AiBacktestSummaryPanelProps {
  backtestId: string;
  onSettingsSuggested?: (suggestions: AISuggestion[]) => void;
}

export const AiBacktestSummaryPanel = ({
  backtestId,
  onSettingsSuggested,
}: AiBacktestSummaryPanelProps) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (user && backtestId) {
      generateSummary();
    }
  }, [user, backtestId]);

  const generateSummary = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Build context for backtest summarizer
      const context = await buildAIContext(user.id, 'backtest_summarizer', {
        backtestId,
      });

      // Build prompt
      const prompt = buildPrompt(
        'backtest_summarizer',
        'Summarize this backtest result. Include overall assessment, strengths, weaknesses, risk level, and recommendations.',
        context
      );

      // Get AI response
      const response = await aiClient.askAI({
        prompt,
        context,
        mode: 'backtest_summarizer',
        userId: user.id,
        stream: false,
      });

      setSummary(response.content);
      
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        if (onSettingsSuggested) {
          onSettingsSuggested(response.suggestions);
        }
      }

      // Log interaction
      await logAIInteraction({
        userId: user.id,
        mode: 'backtest_summarizer',
        input: 'Summarize this backtest result',
        output: response.content,
        contextSummary: context,
      });

    } catch (error: any) {
      console.error('Error generating backtest summary:', error);
      setSummary('Unable to generate summary at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowSuggestions = () => {
    setShowSuggestions(true);
    if (onSettingsSuggested && suggestions.length > 0) {
      onSettingsSuggested(suggestions);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Backtest Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Generating AI summary...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Backtest Summary
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSummary}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <>
            {/* Summary Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Suggested Settings Improvements
                    </h4>
                    {!showSuggestions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShowSuggestions}
                      >
                        Show Suggestions
                      </Button>
                    )}
                  </div>

                  {showSuggestions && (
                    <div className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <Card key={idx} className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Badge variant="outline" className="mb-2">
                                  {suggestion.title}
                                </Badge>
                                <p className="text-sm">{suggestion.description}</p>
                                {suggestion.data && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    {Object.entries(suggestion.data).map(([key, value]) => (
                                      <div key={key}>
                                        {key}: {String(value)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              Click refresh to generate AI summary
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

