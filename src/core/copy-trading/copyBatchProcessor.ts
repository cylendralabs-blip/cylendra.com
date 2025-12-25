/**
 * Copy Trading Batch Processor
 * 
 * Phase X.17 - Batch Processing
 * 
 * Handles batch processing of copy trades for better performance
 */

import type { MasterExecutionContext, FollowerConfig } from './types';

interface BatchConfig {
  maxBatchSize: number;
  batchDelay: number; // milliseconds between batches
  maxConcurrent: number; // max concurrent trades per follower
}

interface BatchItem {
  context: MasterExecutionContext;
  follower: FollowerConfig;
  priority: number; // Higher = more important
}

class CopyBatchProcessor {
  private queue: BatchItem[] = [];
  private processing: boolean = false;
  private config: BatchConfig = {
    maxBatchSize: 50,
    batchDelay: 100, // 100ms between batches
    maxConcurrent: 5,
  };

  /**
   * Add trade to batch queue
   */
  addToBatch(
    context: MasterExecutionContext,
    followers: FollowerConfig[],
    priority: number = 0
  ): void {
    followers.forEach(follower => {
      this.queue.push({
        context,
        follower,
        priority,
      });
    });

    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already
    if (!this.processing) {
      this.processBatch();
    }
  }

  /**
   * Process batch queue
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Get batch
      const batch = this.queue.splice(0, this.config.maxBatchSize);

      // Process batch in parallel (with concurrency limit)
      await this.processBatchItems(batch);

      // Delay before next batch
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      }
    }

    this.processing = false;
  }

  /**
   * Process batch items with concurrency control
   */
  private async processBatchItems(batch: BatchItem[]): Promise<void> {
    // Group by follower to respect maxConcurrent per follower
    const byFollower = new Map<string, BatchItem[]>();
    batch.forEach(item => {
      const followerId = item.follower.followerUserId;
      if (!byFollower.has(followerId)) {
        byFollower.set(followerId, []);
      }
      byFollower.get(followerId)!.push(item);
    });

    // Process each follower's trades with concurrency limit
    const followerPromises = Array.from(byFollower.entries()).map(([followerId, items]) =>
      this.processFollowerBatch(followerId, items)
    );

    await Promise.allSettled(followerPromises);
  }

  /**
   * Process batch for a single follower with concurrency control
   */
  private async processFollowerBatch(
    followerId: string,
    items: BatchItem[]
  ): Promise<void> {
    // Process in chunks of maxConcurrent
    for (let i = 0; i < items.length; i += this.config.maxConcurrent) {
      const chunk = items.slice(i, i + this.config.maxConcurrent);
      
      await Promise.allSettled(
        chunk.map(item => this.processSingleTrade(item))
      );
    }
  }

  /**
   * Process single trade
   */
  private async processSingleTrade(item: BatchItem): Promise<void> {
    try {
      // Import dependencies dynamically to avoid circular deps
      const { handleMasterExecution } = await import('./copyEngine');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get trade executor (simplified - in production, inject properly)
      const tradeExecutor = {
        executeTrade: async (params: any) => {
          // This should call the actual trade execution service
          // For now, return a placeholder
          return { success: false, error: 'Trade executor not configured' };
        },
      };

      await handleMasterExecution(
        item.context,
        supabase,
        tradeExecutor
      );
    } catch (error) {
      console.error(`Error processing batch trade for follower ${item.follower.followerUserId}:`, error);
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
export const copyBatchProcessor = new CopyBatchProcessor();

/**
 * Process trades in batch mode
 */
export async function processCopyTradesBatch(
  context: MasterExecutionContext,
  followers: FollowerConfig[],
  options?: {
    priority?: number;
    batchSize?: number;
    delay?: number;
  }
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}> {
  const processed: number[] = [];
  const failed: string[] = [];

  // Update config if provided
  if (options?.batchSize || options?.delay) {
    copyBatchProcessor.updateConfig({
      maxBatchSize: options.batchSize || 50,
      batchDelay: options.delay || 100,
    });
  }

  // Add to batch queue
  copyBatchProcessor.addToBatch(
    context,
    followers,
    options?.priority || 0
  );

  // Wait for processing (simplified - in production, use proper async tracking)
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (copyBatchProcessor.getQueueSize() === 0) {
        clearInterval(checkInterval);
        resolve({
          success: true,
          processed: processed.length,
          failed: failed.length,
          errors: failed,
        });
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve({
        success: false,
        processed: processed.length,
        failed: failed.length,
        errors: ['Batch processing timeout'],
      });
    }, 30000);
  });
}

