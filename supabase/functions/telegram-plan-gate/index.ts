/**
 * Telegram Plan Gate Edge Function
 * 
 * Phase X.10 - Subscription Plans Engine
 * 
 * Manages Telegram channel access based on user plans
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { canUseFeature } from '../_shared/planGuard.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('telegram-plan-gate');

/**
 * Get user's telegram channels based on plan
 */
async function getUserTelegramChannels(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string[]> {
  try {
    // Get user plan
    const { data: userPlan, error: planError } = await supabaseClient
      .from('user_plans')
      .select(`
        status,
        expires_at,
        plan:plans(code, features)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (planError && planError.code !== 'PGRST116') {
      logger.error('Error fetching user plan:', planError);
      return [];
    }

    // If no plan, return empty (FREE plan has no telegram access)
    if (!userPlan || !userPlan.plan) {
      return [];
    }

    const plan = userPlan.plan as any;
    const features = plan.features;

    // Check if plan is expired
    if (userPlan.expires_at && new Date(userPlan.expires_at) < new Date()) {
      return [];
    }

    // Determine which channels user can access based on features
    const channels: string[] = [];

    if (features.signals?.telegram_basic) {
      channels.push('BASIC_SIGNALS');
    }

    if (features.signals?.telegram_ai) {
      channels.push('AI_SIGNALS');
    }

    if (features.signals?.telegram_realtime) {
      channels.push('REALTIME_SIGNALS');
    }

    // Get actual channel codes from telegram_channels table
    const { data: telegramChannels, error: channelsError } = await supabaseClient
      .from('telegram_channels')
      .select('code')
      .in('plan_code', [plan.code])
      .eq('is_active', true);

    if (channelsError) {
      logger.error('Error fetching telegram channels:', channelsError);
      return [];
    }

    return (telegramChannels || []).map((c: any) => c.code);
  } catch (error) {
    logger.error('Error in getUserTelegramChannels:', error);
    return [];
  }
}

/**
 * Grant telegram access to user
 */
async function grantTelegramAccess(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  channelCode: string
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('telegram_access')
      .upsert({
        user_id: userId,
        channel_code: channelCode,
        status: 'active',
        granted_at: new Date().toISOString(),
        revoked_at: null,
      }, {
        onConflict: 'user_id,channel_code'
      });

    if (error) {
      logger.error('Error granting telegram access:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in grantTelegramAccess:', error);
    return false;
  }
}

/**
 * Revoke telegram access from user
 */
async function revokeTelegramAccess(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  channelCode: string
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('telegram_access')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('channel_code', channelCode);

    if (error) {
      logger.error('Error revoking telegram access:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in revokeTelegramAccess:', error);
    return false;
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      // Get user's telegram channels
      const channels = await getUserTelegramChannels(supabaseClient, user.id);

      return new Response(
        JSON.stringify({
          success: true,
          channels,
          userId: user.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, channelCode } = body;

      if (action === 'grant') {
        // Check if user has access to this channel
        const channels = await getUserTelegramChannels(supabaseClient, user.id);
        
        if (!channels.includes(channelCode)) {
          return new Response(
            JSON.stringify({ 
              error: 'PLAN_LIMIT:CHANNEL_NOT_ALLOWED',
              message: `Channel ${channelCode} is not available in your current plan`
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const granted = await grantTelegramAccess(supabaseClient, user.id, channelCode);

        return new Response(
          JSON.stringify({
            success: granted,
            message: granted ? 'Access granted' : 'Failed to grant access'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (action === 'revoke') {
        const revoked = await revokeTelegramAccess(supabaseClient, user.id, channelCode);

        return new Response(
          JSON.stringify({
            success: revoked,
            message: revoked ? 'Access revoked' : 'Failed to revoke access'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

