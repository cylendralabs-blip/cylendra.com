/**
 * Copy Trading Social Features
 * 
 * Phase X.17 - Social Features
 * 
 * Functions for ratings, reviews, and comments
 */

import { supabase } from '@/integrations/supabase/client';

export interface StrategyRating {
  id: string;
  strategy_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyComment {
  id: string;
  strategy_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  replies?: StrategyComment[];
  user?: {
    full_name?: string;
    email?: string;
  };
}

/**
 * Rate a strategy
 */
export async function rateStrategy(
  strategyId: string,
  rating: number,
  review?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    const { error } = await (supabase as any)
      .from('copy_strategy_ratings')
      .upsert({
        strategy_id: strategyId,
        user_id: user.id,
        rating,
        review: review || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'strategy_id,user_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get strategy ratings
 */
export async function getStrategyRatings(
  strategyId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ data: StrategyRating[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('copy_strategy_ratings')
      .select('*, profiles(full_name, email)')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: ((data || []) as unknown as StrategyRating[]) };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add a comment
 */
export async function addComment(
  strategyId: string,
  content: string,
  parentCommentId?: string
): Promise<{ success: boolean; data?: StrategyComment; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    const { data, error } = await (supabase as any)
      .from('copy_strategy_comments')
      .insert({
        strategy_id: strategyId,
        user_id: user.id,
        parent_comment_id: parentCommentId || null,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as unknown as StrategyComment) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get strategy comments
 */
export async function getStrategyComments(
  strategyId: string
): Promise<{ data: StrategyComment[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('copy_strategy_comments')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('strategy_id', strategyId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    // Get replies for each comment
    const comments = ((data || []) as unknown as StrategyComment[]);
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const { data: replies } = await (supabase as any)
          .from('copy_strategy_comments')
          .select(`
            *,
            profiles(full_name, email)
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: ((replies || []) as unknown as StrategyComment[]),
        };
      })
    );

    return { data: commentsWithReplies };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('copy_strategy_comments')
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('copy_strategy_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(
  strategyId: string
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, isFavorite: false, error: 'Not authenticated' };
    }

    // Check if already favorited
    const { data: existing } = await (supabase as any)
      .from('copy_strategy_favorites')
      .select('id')
      .eq('strategy_id', strategyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Remove favorite
      const { error } = await (supabase as any)
        .from('copy_strategy_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) {
        return { success: false, isFavorite: true, error: error.message };
      }

      return { success: true, isFavorite: false };
    } else {
      // Add favorite
      const { error } = await (supabase as any)
        .from('copy_strategy_favorites')
        .insert({
          strategy_id: strategyId,
          user_id: user.id,
        });

      if (error) {
        return { success: false, isFavorite: false, error: error.message };
      }

      return { success: true, isFavorite: true };
    }
  } catch (error) {
    return {
      success: false,
      isFavorite: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if strategy is favorited
 */
export async function isStrategyFavorited(
  strategyId: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data } = await (supabase as any)
      .from('copy_strategy_favorites')
      .select('id')
      .eq('strategy_id', strategyId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  } catch (error) {
    return false;
  }
}

