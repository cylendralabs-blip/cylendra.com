/**
 * Copy Register Strategy Edge Function
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Allows users to register/create a copy trading strategy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, getUserFromRequest, parseJsonBody, validateRequiredFields, handleError } from '../_shared/utils.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireFeature } from '../_shared/planGuard.ts';
import { copyRateLimiter } from '../_shared/copyRateLimiter.ts';

const logger = createLogger('copy-register-strategy');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user can be a master (create strategies)
    try {
      await requireFeature(supabaseClient, user.id, 'copy.can_be_master', 'Creating copy strategies requires PRO plan or higher');
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await parseJsonBody(req);
    const { action } = body;

    if (action === 'create') {
      // Check rate limit
      const rateLimit = copyRateLimiter.check(user.id, 'create_strategy');
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Maximum 5 strategies per day.',
            resetAt: rateLimit.resetAt 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            } 
          }
        );
      }

      // Validate required fields
      const validation = validateRequiredFields(body, ['name', 'strategy_type']);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: `Missing required fields: ${validation.missing.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const {
        name,
        description,
        bot_id,
        strategy_type,
        is_public = false,
        min_deposit = 0,
        risk_label,
        fee_model = 'NONE',
        profit_share_percent,
        monthly_fee,
      } = body;

      // Validate strategy_type
      if (!['AI_MASTER', 'HUMAN_BOT', 'INFLUENCER'].includes(strategy_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid strategy_type. Must be AI_MASTER, HUMAN_BOT, or INFLUENCER' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate fee_model
      if (!['NONE', 'PROFIT_SHARE', 'SUBSCRIPTION'].includes(fee_model)) {
        return new Response(
          JSON.stringify({ error: 'Invalid fee_model. Must be NONE, PROFIT_SHARE, or SUBSCRIPTION' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If bot_id provided, verify it belongs to user
      if (bot_id) {
        const { data: bot, error: botError } = await supabaseClient
          .from('bot_settings')
          .select('id')
          .eq('id', bot_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (botError || !bot) {
          return new Response(
            JSON.stringify({ error: 'Bot not found or does not belong to user' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create strategy
      const { data: strategy, error: createError } = await supabaseClient
        .from('copy_strategies')
        .insert({
          owner_user_id: user.id,
          bot_id: bot_id || null,
          name,
          description: description || null,
          strategy_type,
          is_public,
          min_deposit,
          risk_label: risk_label || null,
          fee_model,
          profit_share_percent: fee_model === 'PROFIT_SHARE' ? profit_share_percent : null,
          monthly_fee: fee_model === 'SUBSCRIPTION' ? monthly_fee : null,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creating strategy:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create strategy', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Initialize performance record
      await supabaseClient
        .from('copy_strategy_performance')
        .insert({
          strategy_id: strategy.id,
          total_copiers: 0,
          total_trades: 0,
          win_rate: 0,
          avg_return: 0,
          max_drawdown: 0,
          last_30d_return: 0,
          last_7d_return: 0,
          total_volume: 0,
        });

      // Audit log (using RPC function)
      try {
        await supabaseClient.rpc('log_copy_trading_audit', {
          p_user_id: user.id,
          p_action: 'CREATE_STRATEGY',
          p_entity_type: 'STRATEGY',
          p_entity_id: strategy.id,
          p_details: {
            name: strategy.name,
            strategy_type: strategy.strategy_type,
            is_public: strategy.is_public,
          },
        });
      } catch (auditError) {
        logger.error('Error logging audit:', auditError);
      }

      return new Response(
        JSON.stringify({ success: true, data: strategy }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      const { strategy_id, ...updates } = body;

      if (!strategy_id) {
        return new Response(
          JSON.stringify({ error: 'strategy_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      const { data: strategy, error: fetchError } = await supabaseClient
        .from('copy_strategies')
        .select('id')
        .eq('id', strategy_id)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (fetchError || !strategy) {
        return new Response(
          JSON.stringify({ error: 'Strategy not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update strategy
      const { data: updated, error: updateError } = await supabaseClient
        .from('copy_strategies')
        .update(updates)
        .eq('id', strategy_id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating strategy:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update strategy', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      const { strategy_id } = body;

      if (!strategy_id) {
        return new Response(
          JSON.stringify({ error: 'strategy_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      const { data: strategy, error: fetchError } = await supabaseClient
        .from('copy_strategies')
        .select('id')
        .eq('id', strategy_id)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (fetchError || !strategy) {
        return new Response(
          JSON.stringify({ error: 'Strategy not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if strategy has active followers
      const { data: followers, error: followersError } = await supabaseClient
        .from('copy_followers')
        .select('id')
        .eq('strategy_id', strategy_id)
        .eq('status', 'ACTIVE')
        .limit(1);

      if (followersError) {
        logger.error('Error checking followers:', followersError);
      }

      if (followers && followers.length > 0) {
        // Close strategy instead of deleting
        const { error: closeError } = await supabaseClient
          .from('copy_strategies')
          .update({ status: 'CLOSED' })
          .eq('id', strategy_id);

        if (closeError) {
          return new Response(
            JSON.stringify({ error: 'Failed to close strategy', details: closeError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Strategy closed (has active followers)' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete strategy (no active followers)
      const { error: deleteError } = await supabaseClient
        .from('copy_strategies')
        .delete()
        .eq('id', strategy_id);

      if (deleteError) {
        logger.error('Error deleting strategy:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete strategy', details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Strategy deleted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use create, update, or delete' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Error in copy-register-strategy:', error);
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

