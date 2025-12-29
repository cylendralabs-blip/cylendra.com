/**
 * Copy Strategy Performance Aggregator Edge Function
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Scheduled function that aggregates performance metrics for copy strategies
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('copy-strategy-performance-aggregator');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Get all active strategies
    const { data: strategies, error: strategiesError } = await supabaseClient
      .from('copy_strategies')
      .select('id')
      .eq('status', 'ACTIVE');

    if (strategiesError) {
      logger.error('Error fetching strategies:', strategiesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch strategies', details: strategiesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!strategies || strategies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active strategies to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const strategy of strategies) {
      try {
        // Get all executed trades for this strategy
        const { data: trades, error: tradesError } = await supabaseClient
          .from('copy_trades_log')
          .select('*')
          .eq('strategy_id', strategy.id)
          .eq('status', 'EXECUTED')
          .not('closed_at', 'is', null);

        if (tradesError) {
          logger.error(`Error fetching trades for strategy ${strategy.id}:`, tradesError);
          continue;
        }

        if (!trades || trades.length === 0) {
          // No trades yet, keep default values
          continue;
        }

        // Calculate metrics
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => (t.pnl_amount || 0) > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        const totalReturn = trades.reduce((sum, t) => sum + (t.pnl_percentage || 0), 0);
        const avgReturn = totalTrades > 0 ? totalReturn / totalTrades : 0;

        // Calculate drawdown (simplified - in production, use equity curve)
        const pnlAmounts = trades.map(t => t.pnl_amount || 0).sort((a, b) => a - b);
        const maxDrawdown = pnlAmounts.length > 0 ? Math.min(...pnlAmounts) : 0;

        // Calculate 7d and 30d returns
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const trades7d = trades.filter(t => new Date(t.closed_at) >= sevenDaysAgo);
        const trades30d = trades.filter(t => new Date(t.closed_at) >= thirtyDaysAgo);

        const return7d = trades7d.reduce((sum, t) => sum + (t.pnl_percentage || 0), 0) / (trades7d.length || 1);
        const return30d = trades30d.reduce((sum, t) => sum + (t.pnl_percentage || 0), 0) / (trades30d.length || 1);

        // Calculate total volume
        const totalVolume = trades.reduce((sum, t) => sum + (parseFloat(t.follower_position_size) || 0), 0);

        // Get active copiers count
        const { data: copiers, error: copiersError } = await supabaseClient
          .from('copy_followers')
          .select('id')
          .eq('strategy_id', strategy.id)
          .eq('status', 'ACTIVE');

        const totalCopiers = copiers?.length || 0;

        // Update performance record
        const { error: updateError } = await supabaseClient
          .from('copy_strategy_performance')
          .upsert({
            strategy_id: strategy.id,
            total_copiers: totalCopiers,
            total_trades: totalTrades,
            win_rate: winRate,
            avg_return: avgReturn,
            max_drawdown: maxDrawdown,
            last_30d_return: return30d,
            last_7d_return: return7d,
            total_volume: totalVolume,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'strategy_id',
          });

        if (updateError) {
          logger.error(`Error updating performance for strategy ${strategy.id}:`, updateError);
        } else {
          results.push({
            strategy_id: strategy.id,
            total_trades,
            win_rate: winRate,
            total_copiers,
          });
        }
      } catch (error) {
        logger.error(`Error processing strategy ${strategy.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Error in copy-strategy-performance-aggregator:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

