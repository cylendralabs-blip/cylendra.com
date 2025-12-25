/**
 * Canned Response Service
 * 
 * Phase Admin E: Quick replies for support tickets
 */

import { supabase } from '@/integrations/supabase/client';

export interface CannedResponse {
  id: string;
  title: string;
  message_text: string;
  category: string | null;
  created_by: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all canned responses
 */
export async function getCannedResponses(
  category?: string
): Promise<{ responses: CannedResponse[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('canned_responses')
      .select('*')
      .order('title', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching canned responses:', error);
      return { responses: [], error: error.message };
    }

    return { responses: data || [] };
  } catch (error) {
    console.error('Error in getCannedResponses:', error);
    return {
      responses: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a canned response
 */
export async function createCannedResponse(
  title: string,
  messageText: string,
  createdBy: string,
  category?: string
): Promise<{ response: CannedResponse | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('canned_responses')
      .insert({
        title,
        message_text: messageText,
        category: category || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      return { response: null, error: error.message };
    }

    return { response: data };
  } catch (error) {
    return {
      response: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a canned response
 */
export async function updateCannedResponse(
  responseId: string,
  updates: Partial<{
    title: string;
    message_text: string;
    category: string | null;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('canned_responses')
      .update(updates)
      .eq('id', responseId);

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
 * Delete a canned response
 */
export async function deleteCannedResponse(
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('canned_responses')
      .delete()
      .eq('id', responseId);

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
 * Increment usage count for a canned response
 */
export async function incrementCannedResponseUsage(
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current usage count
    const { data: current } = await (supabase as any)
      .from('canned_responses')
      .select('usage_count')
      .eq('id', responseId)
      .single();

    if (!current) {
      return { success: false, error: 'Response not found' };
    }

    const { error } = await (supabase as any)
      .from('canned_responses')
      .update({ usage_count: (current.usage_count || 0) + 1 })
      .eq('id', responseId);

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

