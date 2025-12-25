/**
 * AI Logger Service
 * 
 * Logs all AI interactions for monitoring and improvement
 * 
 * Phase 11: AI Assistant Integration - Task 11
 */

import { supabase } from '@/integrations/supabase/client';
import { AIMode, AIResponse, AIContext } from './types';

export interface AILogEntry {
  userId: string;
  mode: AIMode;
  input: string;
  output: string;
  contextSummary?: Record<string, any>;
  metadata?: {
    confidence?: number;
    tokensUsed?: number;
    responseTime?: number;
    provider?: string;
    model?: string;
  };
}

/**
 * Log AI interaction
 */
export async function logAIInteraction(entry: AILogEntry): Promise<void> {
  try {
    // Sanitize context summary (remove sensitive data)
    const contextSummary = sanitizeContext(entry.contextSummary);

    const { error } = await supabase
      .from('ai_interactions' as any)
      .insert({
        user_id: entry.userId,
        mode: entry.mode,
        input: entry.input,
        output: entry.output,
        context_summary: contextSummary,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('Error logging AI interaction:', error);
      // Don't throw - logging should not break the main flow
    }
  } catch (error) {
    console.error('Error logging AI interaction:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;

  const sanitized: Record<string, any> = {};

  // Only include safe, non-sensitive data
  if (context.botSettings) {
    sanitized.botSettings = {
      risk_percentage: context.botSettings.risk_percentage,
      leverage: context.botSettings.leverage,
      max_active_trades: context.botSettings.max_active_trades,
      // Don't include sensitive settings
    };
  }

  if (context.portfolio) {
    sanitized.portfolio = {
      totalEquity: context.portfolio.totalEquity,
      exposurePercentage: context.portfolio.exposurePercentage,
      // Don't include exact amounts or balances
    };
  }

  if (context.signal) {
    sanitized.signal = {
      symbol: context.signal.symbol,
      side: context.signal.side,
      // Don't include signal IDs or exact prices
    };
  }

  if (context.riskMetrics) {
    sanitized.riskMetrics = {
      dailyLoss: context.riskMetrics.dailyLoss,
      dailyLossLimit: context.riskMetrics.dailyLossLimit,
      // Percentages only, no exact amounts
    };
  }

  if (context.backtestResult) {
    sanitized.backtestResult = {
      totalReturn: context.backtestResult.totalReturn,
      winRate: context.backtestResult.winRate,
      profitFactor: context.backtestResult.profitFactor,
      // Performance metrics only
    };
  }

  return sanitized;
}

/**
 * Get recent AI interactions for a user
 */
export async function getRecentAIInteractions(
  userId: string,
  limit: number = 10
): Promise<AILogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('ai_interactions' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI interactions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      userId: row.user_id,
      mode: row.mode as AIMode,
      input: row.input,
      output: row.output,
      contextSummary: row.context_summary,
      metadata: row.metadata,
    }));
  } catch (error) {
    console.error('Error fetching AI interactions:', error);
    return [];
  }
}

