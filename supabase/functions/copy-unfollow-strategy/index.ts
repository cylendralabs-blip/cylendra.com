/**
 * Copy Unfollow Strategy Edge Function
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Allows users to unfollow/stop following a copy trading strategy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, getUserFromRequest, parseJsonBody, validateRequiredFields, handleError } from '../_shared/utils.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('copy-unfollow-strategy');

serve(async (req) => {
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

    const body = await parseJsonBody(req);
    const validation = validateRequiredFields(body, ['strategy_id']);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${validation.missing.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { strategy_id, close_all_trades = false } = body;

    // Get follower record
    const { data: follower, error: fetchError } = await supabaseClient
      .from('copy_followers')
      .select('*')
      .eq('follower_user_id', user.id)
      .eq('strategy_id', strategy_id)
      .maybeSingle();

    if (fetchError || !follower) {
      return new Response(
        JSON.stringify({ error: 'Not following this strategy' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to STOPPED
    const { data: updated, error: updateError } = await supabaseClient
      .from('copy_followers')
      .update({
        status: 'STOPPED',
        stop_copy_at: new Date().toISOString(),
      })
      .eq('id', follower.id)
      .select()
      .single();

    // Audit log (using RPC function)
    try {
      await supabaseClient.rpc('log_copy_trading_audit', {
        p_user_id: user.id,
        p_action: 'UNFOLLOW',
        p_entity_type: 'FOLLOWER',
        p_entity_id: strategy_id,
        p_details: {
          close_all_trades,
        },
      });
    } catch (auditError) {
      logger.error('Error logging audit:', auditError);
    }

    if (updateError) {
      logger.error('Error updating follower:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to unfollow strategy', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If close_all_trades is true, close all open copied trades
    if (close_all_trades) {
      const { data: openTrades, error: tradesError } = await supabaseClient
        .from('copy_trades_log')
        .select('*')
        .eq('follower_user_id', user.id)
        .eq('strategy_id', strategy_id)
        .eq('status', 'EXECUTED')
        .is('closed_at', null);

      if (!tradesError && openTrades && openTrades.length > 0) {
        // Mark trades as closed (actual closing should be handled by trade executor)
        await supabaseClient
          .from('copy_trades_log')
          .update({ closed_at: new Date().toISOString() })
          .eq('follower_user_id', user.id)
          .eq('strategy_id', strategy_id)
          .eq('status', 'EXECUTED')
          .is('closed_at', null);
      }
    }

    // Update strategy performance (decrement copiers count)
    const { data: perf } = await supabaseClient
      .from('copy_strategy_performance')
      .select('total_copiers')
      .eq('strategy_id', strategy_id)
      .maybeSingle();

    if (perf && perf.total_copiers > 0) {
      await supabaseClient
        .from('copy_strategy_performance')
        .update({ total_copiers: Math.max(0, (perf.total_copiers || 0) - 1) })
        .eq('strategy_id', strategy_id);
    }

    return new Response(
      JSON.stringify({ success: true, data: updated, closed_trades: close_all_trades }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Error in copy-unfollow-strategy:', error);
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

