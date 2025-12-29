/**
 * AI Trade Explainer Modal
 * 
 * Modal that explains why a specific trade was executed
 * Shows signal reason, indicators, and risk analysis
 * 
 * Phase 11: AI Assistant Integration - Task 6
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, TrendingUp, TrendingDown, AlertCircle, ScrollText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildAIContext } from '@/services/ai/contextBuilder';
import { aiClient } from '@/services/ai/aiClient';
import { buildPrompt } from '@/services/ai/prompts';
import { logAIInteraction } from '@/services/ai/aiLogger';
import { AIContext } from '@/services/ai/types';
import { formatDistanceToNow } from 'date-fns';

interface AiTradeExplainerModalProps {
  tradeId?: string;
  signalId?: string;
  trigger?: React.ReactNode;
  onExplanationReady?: (explanation: string) => void;
}

export const AiTradeExplainerModal = ({
  tradeId,
  signalId,
  trigger,
  onExplanationReady,
}: AiTradeExplainerModalProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<AIContext | null>(null);

  useEffect(() => {
    if (isOpen && !explanation && user && (tradeId || signalId)) {
      fetchExplanation();
    }
  }, [isOpen, tradeId, signalId, user]);

  const fetchExplanation = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build context for trade explainer
      const context = await buildAIContext(user.id, 'trade_explainer', {
        tradeId,
        signalId,
      });
      setContextSnapshot(context);

      // Build prompt
      const prompt = buildPrompt(
        'trade_explainer',
        'Why was this trade executed? Please explain the reasoning behind this trade decision.',
        context
      );

      // Get AI response
      const response = await aiClient.askAI({
        prompt,
        context,
        mode: 'trade_explainer',
        userId: user.id,
        stream: false,
      });

      setExplanation(response.content);

      if (onExplanationReady) {
        onExplanationReady(response.content);
      }

      // Log interaction
      await logAIInteraction({
        userId: user.id,
        mode: 'trade_explainer',
        input: 'Why was this trade executed?',
        output: response.content,
        contextSummary: context,
      });

    } catch (err: any) {
      console.error('Error fetching trade explanation:', err);
      setError(err.message || 'Failed to generate explanation');
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Info className="h-4 w-4" />
      Why this trade?
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Trade Execution Explanation
          </DialogTitle>
          <DialogDescription>
            AI-powered explanation of why this trade was executed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {contextSnapshot?.signal && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Signal Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{contextSnapshot.signal.symbol}</Badge>
                  <Badge variant={contextSnapshot.signal.side === 'buy' ? 'default' : 'destructive'}>
                    {contextSnapshot.signal.side.toUpperCase()}
                  </Badge>
                </div>
                {contextSnapshot.signal.reason && (
                  <p className="text-muted-foreground">{contextSnapshot.signal.reason}</p>
                )}
                {contextSnapshot.position && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Entry Price</p>
                      <p className="font-semibold">${contextSnapshot.position.entryPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Price</p>
                      <p className="font-semibold">${contextSnapshot.position.currentPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unrealized PnL</p>
                      <p className={`font-semibold ${contextSnapshot.position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {contextSnapshot.position.unrealizedPnl >= 0 ? '+' : ''}${contextSnapshot.position.unrealizedPnl.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DCA Levels Completed</p>
                      <p className="font-semibold">{contextSnapshot.position.dcaLevels}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {contextSnapshot?.strategyLogs && contextSnapshot.strategyLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="h-4 w-4" />
                  Strategy Log Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {contextSnapshot.strategyLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-primary/30 pl-3 py-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="uppercase tracking-wider">{log.category}</span>
                      <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Analyzing trade decision...
              </span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Error
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {explanation && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{explanation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!explanation && !isLoading && !error && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>Click "Why this trade?" to get an explanation.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

