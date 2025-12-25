/**
 * Copy Follow Strategy Edge Function
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Allows users to follow/subscribe to a copy trading strategy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, getUserFromRequest, parseJsonBody, validateRequiredFields, handleError } from '../_shared/utils.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { canUseFeature } from '../_shared/planGuard.ts';
import { copyRateLimiter } from '../_shared/copyRateLimiter.ts';

const logger = createLogger('copy-follow-strategy');

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

    let {
      strategy_id,
      allocation_mode = 'PERCENT',
      allocation_value = 10,
      max_daily_loss = 5,
      max_total_loss = 20,
      max_open_trades = 10,
      max_leverage = 3,
      risk_multiplier = 1,
    } = body;

    // Basic validation (full validation should be done in frontend)
    if (allocation_value <= 0) {
      return new Response(
        JSON.stringify({ error: 'Allocation value must be greater than 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (allocation_mode === 'PERCENT' && allocation_value > 100) {
      return new Response(
        JSON.stringify({ error: 'Allocation percentage cannot exceed 100%' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (max_leverage < 1 || max_leverage > 125) {
      return new Response(
        JSON.stringify({ error: 'Max leverage must be between 1 and 125' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (risk_multiplier <= 0 || risk_multiplier > 5) {
      return new Response(
        JSON.stringify({ error: 'Risk multiplier must be between 0.1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = copyRateLimiter.check(user.id, 'follow_strategy');
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
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

    // Check if user can follow strategies
    const canFollow = await canUseFeature(supabaseClient, user.id, 'copy.follow_enabled');
    if (!canFollow) {
      return new Response(
        JSON.stringify({ error: 'Copy trading is not available in your plan' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check current following count
    const { data: currentFollows, error: followsError } = await supabaseClient
      .from('copy_followers')
      .select('id')
      .eq('follower_user_id', user.id)
      .eq('status', 'ACTIVE');

    if (followsError) {
      logger.error('Error checking current follows:', followsError);
    }

    // Get user plan limits
    const { data: userPlan } = await supabaseClient
      .from('user_plans')
      .select('plan:plans(limits)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const maxStrategies = userPlan?.plan?.limits?.copy?.max_strategies || 1;
    if (currentFollows && currentFollows.length >= maxStrategies) {
      return new Response(
        JSON.stringify({ error: `Maximum strategies limit reached (${maxStrategies}). Please upgrade your plan.` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get strategy
    const { data: strategy, error: strategyError } = await supabaseClient
      .from('copy_strategies')
      .select('*')
      .eq('id', strategy_id)
      .eq('status', 'ACTIVE')
      .eq('is_public', true)
      .maybeSingle();

    if (strategyError || !strategy) {
      return new Response(
        JSON.stringify({ error: 'Strategy not found or not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-following
    if (strategy.owner_user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot follow your own strategy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already following
    const { data: existing, error: existingError } = await supabaseClient
      .from('copy_followers')
      .select('id, status')
      .eq('follower_user_id', user.id)
      .eq('strategy_id', strategy_id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      logger.error('Error checking existing follow:', existingError);
    }

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return new Response(
          JSON.stringify({ error: 'Already following this strategy' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Reactivate
        const { data: reactivated, error: reactivateError } = await supabaseClient
          .from('copy_followers')
          .update({
            status: 'ACTIVE',
            allocation_mode,
            allocation_value,
            max_daily_loss,
            max_total_loss,
            max_open_trades,
            max_leverage,
            risk_multiplier,
            start_copy_at: new Date().toISOString(),
            stop_copy_at: null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (reactivateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate follow', details: reactivateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: reactivated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check min deposit
    if (strategy.min_deposit > 0) {
      // Get user equity (simplified - in production, calculate from portfolio)
      const { data: balances } = await supabaseClient
        .from('portfolio_balances')
        .select('total_balance')
        .eq('user_id', user.id);

      const totalEquity = balances?.reduce((sum: number, b: any) => sum + (parseFloat(b.total_balance) || 0), 0) || 0;

      if (totalEquity < strategy.min_deposit) {
        return new Response(
          JSON.stringify({ error: `Minimum deposit required: $${strategy.min_deposit.toFixed(2)}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create follower record
    const { data: follower, error: createError } = await supabaseClient
      .from('copy_followers')
      .insert({
        follower_user_id: user.id,
        strategy_id,
        status: 'ACTIVE',
        allocation_mode,
        allocation_value,
        max_daily_loss,
        max_total_loss,
        max_open_trades,
        max_leverage,
        risk_multiplier,
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating follower:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to follow strategy', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update strategy performance (increment copiers count)
    await supabaseClient.rpc('increment_strategy_copiers', { strategy_uuid: strategy_id }).catch(() => {
      // Fallback: manual update
      const { data: perf } = await supabaseClient
        .from('copy_strategy_performance')
        .select('total_copiers')
        .eq('strategy_id', strategy_id)
        .maybeSingle();

      if (perf) {
        await supabaseClient
          .from('copy_strategy_performance')
          .update({ total_copiers: (perf.total_copiers || 0) + 1 })
          .eq('strategy_id', strategy_id);
      }
    });

    return new Response(
      JSON.stringify({ success: true, data: follower }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Error in copy-follow-strategy:', error);
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

