/**
 * AI Rate Limiter
 * 
 * Phase 18: Implement basic rate limiting per user for AI Chat
 */

import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 50,
  maxRequestsPerDay: 200,
};

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get AI interaction logs (assuming ai_interactions table exists)
    const { data: interactions, error } = await (supabase as any)
      .from('ai_interactions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking rate limit:', error);
      // Allow on error to avoid blocking users
      return { allowed: true };
    }

    if (!interactions || interactions.length === 0) {
      return { allowed: true };
    }

    // Count requests in different time windows
    const requestsLastMinute = interactions.filter(
      (i) => new Date(i.created_at) > oneMinuteAgo
    ).length;
    const requestsLastHour = interactions.filter(
      (i) => new Date(i.created_at) > oneHourAgo
    ).length;
    const requestsLastDay = interactions.filter(
      (i) => new Date(i.created_at) > oneDayAgo
    ).length;

    // Check limits
    if (requestsLastMinute >= config.maxRequestsPerMinute) {
      const oldestInMinute = interactions
        .filter((i) => new Date(i.created_at) > oneMinuteAgo)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      
      if (oldestInMinute) {
        const retryAfter = Math.ceil(
          (60 - (now.getTime() - new Date(oldestInMinute.created_at).getTime()) / 1000)
        );
        return {
          allowed: false,
          reason: 'Rate limit exceeded: too many requests per minute',
          retryAfter,
        };
      }
    }

    if (requestsLastHour >= config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per hour',
        retryAfter: 3600, // 1 hour in seconds
      };
    }

    if (requestsLastDay >= config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: too many requests per day',
        retryAfter: 86400, // 24 hours in seconds
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    // Allow on error to avoid blocking users
    return { allowed: true };
  }
}

/**
 * Record AI interaction for rate limiting
 */
export async function recordAIInteraction(
  userId: string,
  prompt: string,
  responseLength: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any).from('ai_interactions').insert({
      user_id: userId,
      prompt: prompt.substring(0, 500), // Store first 500 chars
      response_length: responseLength,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error recording AI interaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in recordAIInteraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

