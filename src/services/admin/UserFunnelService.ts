/**
 * User Funnel Service
 * 
 * Phase Admin C: Track user journey through funnel stages
 */

import { supabase } from '@/integrations/supabase/client';

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate: number;
}

export interface UserFunnelData {
  registered: number;
  apiConnected: number;
  firstFeatureUsed: number;
  firstTrade: number;
  convertedToPaid: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
}

/**
 * Get user funnel data
 */
export async function getUserFunnelData(): Promise<{ funnel: UserFunnelData | null; error?: string }> {
  try {
    // Get total registered users
    const { count: totalUsers } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get funnel stages
    const { data: funnelStages } = await (supabase as any)
      .from('user_funnel_stages')
      .select('*');

    if (!funnelStages || funnelStages.length === 0) {
      // If no funnel data exists, calculate from available data
      const { count: apiConnected } = await (supabase as any)
        .from('api_keys')
        .select('*', { count: 'exact', head: true });

      const { count: firstTrade } = await (supabase as any)
        .from('trades')
        .select('*', { count: 'exact', head: true });

      return {
        funnel: {
          registered: totalUsers || 0,
          apiConnected: apiConnected || 0,
          firstFeatureUsed: 0, // Would need feature usage tracking
          firstTrade: firstTrade || 0,
          convertedToPaid: 0, // Would need subscription data
          retentionD1: 0,
          retentionD7: 0,
          retentionD30: 0,
        },
      };
    }

    // Calculate from funnel stages
    const registered = totalUsers || 0;
    const apiConnected = funnelStages.filter((s: any) => s.api_connected_at).length;
    const firstFeatureUsed = funnelStages.filter((s: any) => s.first_feature_used_at).length;
    const firstTrade = funnelStages.filter((s: any) => s.first_trade_at).length;
    const convertedToPaid = funnelStages.filter((s: any) => s.converted_to_paid_at).length;
    const retentionD1 = funnelStages.filter((s: any) => s.retention_d1).length;
    const retentionD7 = funnelStages.filter((s: any) => s.retention_d7).length;
    const retentionD30 = funnelStages.filter((s: any) => s.retention_d30).length;

    return {
      funnel: {
        registered,
        apiConnected,
        firstFeatureUsed,
        firstTrade,
        convertedToPaid,
        retentionD1,
        retentionD7,
        retentionD30,
      },
    };
  } catch (error) {
    console.error('Error in getUserFunnelData:', error);
    return {
      funnel: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get funnel stages with percentages
 */
export async function getFunnelStages(): Promise<{ stages: FunnelStage[]; error?: string }> {
  try {
    const { funnel, error } = await getUserFunnelData();
    if (error || !funnel) {
      return { stages: [], error };
    }

    const stages: FunnelStage[] = [
      {
        stage: 'Registered',
        count: funnel.registered,
        percentage: 100,
        dropOffRate: 0,
      },
      {
        stage: 'API Connected',
        count: funnel.apiConnected,
        percentage: funnel.registered > 0 ? (funnel.apiConnected / funnel.registered) * 100 : 0,
        dropOffRate: funnel.registered > 0 ? ((funnel.registered - funnel.apiConnected) / funnel.registered) * 100 : 0,
      },
      {
        stage: 'First Feature Used',
        count: funnel.firstFeatureUsed,
        percentage: funnel.registered > 0 ? (funnel.firstFeatureUsed / funnel.registered) * 100 : 0,
        dropOffRate: funnel.apiConnected > 0 ? ((funnel.apiConnected - funnel.firstFeatureUsed) / funnel.apiConnected) * 100 : 0,
      },
      {
        stage: 'First Trade',
        count: funnel.firstTrade,
        percentage: funnel.registered > 0 ? (funnel.firstTrade / funnel.registered) * 100 : 0,
        dropOffRate: funnel.firstFeatureUsed > 0 ? ((funnel.firstFeatureUsed - funnel.firstTrade) / funnel.firstFeatureUsed) * 100 : 0,
      },
      {
        stage: 'Converted to Paid',
        count: funnel.convertedToPaid,
        percentage: funnel.registered > 0 ? (funnel.convertedToPaid / funnel.registered) * 100 : 0,
        dropOffRate: funnel.firstTrade > 0 ? ((funnel.firstTrade - funnel.convertedToPaid) / funnel.firstTrade) * 100 : 0,
      },
    ];

    return { stages };
  } catch (error) {
    console.error('Error in getFunnelStages:', error);
    return {
      stages: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update user funnel stage
 */
export async function updateUserFunnelStage(
  userId: string,
  stage: 'api_connected' | 'first_feature_used' | 'first_trade' | 'converted_to_paid',
  timestamp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    const stageField = {
      api_connected: 'api_connected_at',
      first_feature_used: 'first_feature_used_at',
      first_trade: 'first_trade_at',
      converted_to_paid: 'converted_to_paid_at',
    }[stage];

    updateData[stageField] = timestamp || new Date().toISOString();

    // Check if funnel stage exists
    const { data: existing } = await (supabase as any)
      .from('user_funnel_stages')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await (supabase as any)
        .from('user_funnel_stages')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new
      const { error } = await (supabase as any)
        .from('user_funnel_stages')
        .insert({
          user_id: userId,
          registered_at: new Date().toISOString(),
          ...updateData,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserFunnelStage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

