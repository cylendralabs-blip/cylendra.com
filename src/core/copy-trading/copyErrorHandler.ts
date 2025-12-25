/**
 * Copy Trading Error Handler
 * 
 * Phase X.17 - Technical Improvements
 * 
 * Enhanced error handling with retry logic and dead letter queue
 */

import { supabase } from '@/integrations/supabase/client';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

interface FailedCopyTrade {
  context: any;
  error: string;
  retryCount: number;
  lastRetryAt?: string;
}

class CopyErrorHandler {
  private failedTrades: Map<string, FailedCopyTrade> = new Map();
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
  };

  /**
   * Handle error with retry logic
   */
  async handleError(
    tradeId: string,
    context: any,
    error: Error,
    retryFn: () => Promise<{ success: boolean; error?: string }>,
    config?: Partial<RetryConfig>
  ): Promise<{ success: boolean; error?: string; retried: boolean }> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const failedTrade = this.failedTrades.get(tradeId);

    if (!failedTrade) {
      // First failure
      this.failedTrades.set(tradeId, {
        context,
        error: error.message,
        retryCount: 0,
      });

      // Try retry
      return this.retry(tradeId, retryFn, retryConfig);
    }

    // Already failed before
    if (failedTrade.retryCount >= retryConfig.maxRetries) {
      // Max retries reached - move to dead letter queue
      await this.moveToDeadLetterQueue(tradeId, failedTrade);
      return {
        success: false,
        error: `Max retries (${retryConfig.maxRetries}) exceeded. Moved to dead letter queue.`,
        retried: false,
      };
    }

    // Retry again
    return this.retry(tradeId, retryFn, retryConfig);
  }

  /**
   * Retry failed trade
   */
  private async retry(
    tradeId: string,
    retryFn: () => Promise<{ success: boolean; error?: string }>,
    config: RetryConfig
  ): Promise<{ success: boolean; error?: string; retried: boolean }> {
    const failedTrade = this.failedTrades.get(tradeId);
    if (!failedTrade) {
      return { success: false, error: 'Trade not found in failed trades', retried: false };
    }

    // Calculate delay with exponential backoff
    const delay = config.retryDelay * Math.pow(config.backoffMultiplier, failedTrade.retryCount);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increment retry count
    failedTrade.retryCount++;
    failedTrade.lastRetryAt = new Date().toISOString();
    this.failedTrades.set(tradeId, failedTrade);

    // Attempt retry
    try {
      const result = await retryFn();
      if (result.success) {
        // Success - remove from failed trades
        this.failedTrades.delete(tradeId);
        return { success: true, retried: true };
      } else {
        // Still failed
        failedTrade.error = result.error || 'Unknown error';
        this.failedTrades.set(tradeId, failedTrade);
        return { success: false, error: result.error, retried: true };
      }
    } catch (error) {
      failedTrade.error = error instanceof Error ? error.message : 'Unknown error';
      this.failedTrades.set(tradeId, failedTrade);
      return {
        success: false,
        error: failedTrade.error,
        retried: true,
      };
    }
  }

  /**
   * Move to dead letter queue (store in database for manual review)
   */
  private async moveToDeadLetterQueue(
    tradeId: string,
    failedTrade: FailedCopyTrade
  ): Promise<void> {
    try {
      // Store in database for manual review
      await (supabase as any).from('copy_trades_log').insert({
        strategy_id: failedTrade.context.strategyId,
        master_user_id: failedTrade.context.masterUserId,
        follower_user_id: failedTrade.context.followerUserId,
        symbol: failedTrade.context.symbol,
        side: failedTrade.context.side,
        market_type: failedTrade.context.marketType,
        status: 'FAILED',
        fail_reason: `DLQ: ${failedTrade.error} (Retries: ${failedTrade.retryCount})`,
      });

      // Remove from memory
      this.failedTrades.delete(tradeId);
    } catch (error) {
      console.error('Error moving to dead letter queue:', error);
    }
  }

  /**
   * Get failed trades count
   */
  getFailedTradesCount(): number {
    return this.failedTrades.size;
  }

  /**
   * Clear all failed trades
   */
  clear(): void {
    this.failedTrades.clear();
  }
}

// Singleton instance
export const copyErrorHandler = new CopyErrorHandler();

