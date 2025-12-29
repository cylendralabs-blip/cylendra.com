/**
 * Support Notes Service
 * 
 * Phase Admin D: Internal support notes for users
 */

import { supabase } from '@/integrations/supabase/client';

export interface SupportNote {
  id: string;
  user_id: string;
  admin_id: string;
  note_text: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Add a support note for a user
 */
export async function addSupportNote(
  userId: string,
  adminId: string,
  noteText: string,
  isImportant: boolean = false
): Promise<{ success: boolean; note?: SupportNote; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_support_notes')
      .insert({
        user_id: userId,
        admin_id: adminId,
        note_text: noteText,
        is_important: isImportant,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding support note:', error);
      return { success: false, error: error.message };
    }

    return { success: true, note: data };
  } catch (error) {
    console.error('Error in addSupportNote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get support notes for a user
 */
export async function getSupportNotes(
  userId: string
): Promise<{ notes: SupportNote[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_support_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support notes:', error);
      return { notes: [], error: error.message };
    }

    return { notes: data || [] };
  } catch (error) {
    console.error('Error in getSupportNotes:', error);
    return {
      notes: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a support note
 */
export async function deleteSupportNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_support_notes')
      .delete()
      .eq('id', noteId);

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
 * Update a support note
 */
export async function updateSupportNote(
  noteId: string,
  noteText: string,
  isImportant?: boolean
): Promise<{ success: boolean; note?: SupportNote; error?: string }> {
  try {
    const updateData: any = { note_text: noteText };
    if (isImportant !== undefined) {
      updateData.is_important = isImportant;
    }

    const { data, error } = await (supabase as any)
      .from('user_support_notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, note: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

