/**
 * AI Risk Insights Card
 * 
 * Displays AI-generated risk assessment on Dashboard
 * Shows current risk status and recommendations
 * 
 * Phase 11: AI Assistant Integration - Task 7
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildAIContext } from '@/services/ai/contextBuilder';
import { aiClient } from '@/services/ai/aiClient';
import { buildPrompt } from '@/services/ai/prompts';
import { requiresRiskWarning, getRiskWarningMessage } from '@/services/ai/guardrails';
import type { AIContext } from '@/services/ai/types';
import { cn } from '@/lib/utils';
import { logAIInteraction } from '@/services/ai/aiLogger';
import { useTranslation } from 'react-i18next';

export const AiRiskInsightsCard = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const [insights, setInsights] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<AIContext | null>(null);
  const [riskWarningMessage, setRiskWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRiskInsights();
    }
  }, [user]);

  const fetchRiskInsights = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Build context
      const context = await buildAIContext(user.id, 'risk_advisor');
      setContextSnapshot(context);

      // Check for risk warnings
      const hasWarning = requiresRiskWarning(context);
      const riskWarning = hasWarning ? getRiskWarningMessage(context) : undefined;

      // Build prompt
      const prompt = buildPrompt(
        'risk_advisor',
        'Provide a brief risk assessment (2-3 sentences) of the current portfolio state. Include risk level (Low/Medium/High).',
        context
      );

      // Get AI response
      const response = await aiClient.askAI({
        prompt,
        context,
        mode: 'risk_advisor',
        userId: user.id,
        stream: false,
      });

      setInsights(response.content);
      setRiskWarningMessage(riskWarning || null);

      // Extract risk level from response
      const content = response.content.toLowerCase();
      if (content.includes('high risk') || content.includes('risky')) {
        setRiskLevel('high');
      } else if (content.includes('medium') || content.includes('moderate')) {
        setRiskLevel('medium');
      } else {
        setRiskLevel('low');
      }

      setLastUpdated(new Date());

      await logAIInteraction({
        userId: user.id,
        mode: 'risk_advisor',
        input: 'Provide a brief risk assessment (2-3 sentences) of the current portfolio state. Include risk level (Low/Medium/High).',
        output: response.content,
        contextSummary: context,
      });

    } catch (error: any) {
      console.error('Error fetching risk insights:', error);
      setInsights(t('ai_risk.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'text-green-500 bg-green-50 dark:bg-green-950/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <TrendingDown className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return t('ai_risk.high_risk');
      case 'medium':
        return t('ai_risk.medium_risk');
      default:
        return t('ai_risk.low_risk');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('ai_risk.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', getRiskLevelColor(riskLevel))}
            >
              {getRiskIcon(riskLevel)}
              <span className="ml-1">{getRiskLevelText(riskLevel)}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRiskInsights}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('ai_risk.analyzing')}
          </div>
        ) : insights ? (
          <>
            {riskWarningMessage && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-200">
                {riskWarningMessage}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">{insights}</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {t('ai_risk.last_updated')}: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            {contextSnapshot?.riskMetrics && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-muted-foreground">{t('ai_risk.daily_loss')}</p>
                  <p className="font-semibold">
                    ${contextSnapshot.riskMetrics.dailyLoss.toFixed(2)} / ${contextSnapshot.riskMetrics.dailyLossLimit.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-muted-foreground">{t('ai_risk.drawdown_limit')}</p>
                  <p className="font-semibold">
                    {contextSnapshot.riskMetrics.currentDrawdown?.toFixed?.(2) ?? 0}% / {contextSnapshot.riskMetrics.maxDrawdown.toFixed(2)}%
                  </p>
                </div>
                {contextSnapshot.portfolio && (
                  <div className="rounded-md bg-muted/50 p-3 col-span-2">
                    <p className="text-muted-foreground">{t('ai_risk.exposure')}</p>
                    <p className="font-semibold">
                      ${contextSnapshot.portfolio.totalExposure.toFixed(2)} ({t('ai_risk.equity_percentage', { value: contextSnapshot.portfolio.exposurePercentage.toFixed(1) })})
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('ai_risk.refresh_prompt')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

