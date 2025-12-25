/**
 * Smart Trade Manager Edge Function
 * 
 * Phase 3.2: Background worker for bot-managed manual trades
 * Manages Smart Trade positions where managed_by_bot = true
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('smart-trade-manager');

/**
 * Configuration
 */
const CONFIG = {
  RUN_INTERVAL_SECONDS: 30, // Run every 30 seconds
  MAX_POSITIONS_PER_RUN: 50,
};

/**
 * Fetch bot-managed Smart Trade positions
 */
async function fetchManagedPositions(supabaseClient: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseClient
    .from('trades')
    .select('*')
    .eq('status', 'ACTIVE')
    .eq('source_mode', 'manual_smart_trade')
    .eq('managed_by_bot', true)
    .limit(CONFIG.MAX_POSITIONS_PER_RUN);

  if (error) {
    logger.error('Error fetching managed positions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get bot settings for management profile
 */
async function getBotSettings(
  supabaseClient: ReturnType<typeof createClient>,
  managementProfileId: string,
  userId: string
) {
  // If management_profile_id is provided, fetch those settings
  if (managementProfileId) {
    const { data, error } = await supabaseClient
      .from('bot_settings')
      .select('*')
      .eq('id', managementProfileId)
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      return data;
    }
  }

  // Fallback: get user's default bot settings
  const { data, error } = await supabaseClient
    .from('bot_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    logger.warn('No bot settings found for user:', userId);
    return null;
  }

  return data;
}

/**
 * Get current price for symbol
 */
async function getCurrentPrice(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  platform: string
): Promise<number | null> {
  try {
    const { data, error } = await supabaseClient.functions.invoke('get-live-prices', {
      body: { symbol, exchange: platform }
    });

    if (error) throw error;
    return data?.price || null;
  } catch (error) {
    logger.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Apply management rules to position
 */
async function applyManagementRules(
  supabaseClient: ReturnType<typeof createClient>,
  position: any,
  botSettings: any,
  currentPrice: number
) {
  const updates: any = {};
  const actions: string[] = [];

  if (!botSettings) {
    logger.warn(`No bot settings for position ${position.id}`);
    return { updates, actions };
  }

  const entryPrice = position.entry_price;
  const pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;

  // 1. Move SL to breakeven when price reaches X% profit
  if (botSettings.capital_protection_enabled && botSettings.capital_protection_profit) {
    const triggerProfit = botSettings.capital_protection_profit;
    
    if (pnlPercentage >= triggerProfit && position.stop_loss_price < entryPrice) {
      updates.stop_loss_price = entryPrice;
      actions.push(`Moved SL to breakeven at ${triggerProfit}% profit`);
    }
  }

  // 2. Apply trailing SL if enabled
  if (botSettings.trailing_stop_distance && botSettings.trailing_stop_activation) {
    const activationProfit = botSettings.trailing_stop_activation;
    const trailingDistance = botSettings.trailing_stop_distance;

    if (pnlPercentage >= activationProfit) {
      // Calculate new trailing SL
      const trailingSL = currentPrice * (1 - trailingDistance / 100);
      
      // Only move SL up (for long positions)
      if (trailingSL > (position.stop_loss_price || 0)) {
        updates.stop_loss_price = trailingSL;
        actions.push(`Updated trailing SL to ${trailingSL.toFixed(2)} (${trailingDistance}% trailing)`);
      }
    }
  }

  // 3. Trigger extra DCA orders if allowed and conditions met
  // This would require checking DCA levels and current price
  // For now, we'll log it as a placeholder
  if (botSettings.dca_levels && position.dca_level < botSettings.dca_levels) {
    // Check if price has dropped enough for next DCA level
    const priceDrop = ((entryPrice - currentPrice) / entryPrice) * 100;
    const dcaTriggerDrop = (position.dca_level + 1) * 2; // 2% per level

    if (priceDrop >= dcaTriggerDrop) {
      actions.push(`DCA level ${position.dca_level + 1} trigger condition met (${priceDrop.toFixed(2)}% drop)`);
      // Note: Actual DCA order placement would be handled by execute-trade or a separate service
    }
  }

  return { updates, actions };
}

/**
 * Check global risk limits
 */
async function checkGlobalRiskLimits(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  botSettings: any
): Promise<{ allowed: boolean; reason?: string }> {
  // Get all active trades for user
  const { data: activeTrades, error } = await supabaseClient
    .from('trades')
    .select('total_invested, stop_loss_price, entry_price')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');

  if (error) {
    logger.error('Error checking risk limits:', error);
    return { allowed: true }; // Allow if check fails
  }

  // Check max concurrent trades
  if (botSettings.max_active_trades) {
    const activeCount = activeTrades?.length || 0;
    if (activeCount >= botSettings.max_active_trades) {
      return {
        allowed: false,
        reason: `Maximum concurrent trades limit reached: ${activeCount}/${botSettings.max_active_trades}`
      };
    }
  }

  // Check max total risk
  // This would require calculating total risk across all positions
  // For now, we'll just check the count

  return { allowed: true };
}

/**
 * Main worker function
 */
async function runSmartTradeManager(): Promise<void> {
  const supabaseClient = getSupabaseClient();

  try {
    logger.info('Starting Smart Trade Manager...');

    // Fetch all bot-managed Smart Trade positions
    const positions = await fetchManagedPositions(supabaseClient);
    logger.info(`Found ${positions.length} managed positions`);

    if (positions.length === 0) {
      return;
    }

    // Process each position
    for (const position of positions) {
      try {
        // Get bot settings for management
        const botSettings = await getBotSettings(
          supabaseClient,
          position.management_profile_id,
          position.user_id
        );

        if (!botSettings) {
          logger.warn(`Skipping position ${position.id}: No bot settings found`);
          continue;
        }

        // Get current price
        const currentPrice = await getCurrentPrice(
          supabaseClient,
          position.symbol,
          position.platform || 'binance'
        );

        if (!currentPrice) {
          logger.warn(`Skipping position ${position.id}: Could not fetch price`);
          continue;
        }

        // Apply management rules
        const { updates, actions } = await applyManagementRules(
          supabaseClient,
          position,
          botSettings,
          currentPrice
        );

        // Update position if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseClient
            .from('trades')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', position.id);

          if (updateError) {
            logger.error(`Error updating position ${position.id}:`, updateError);
          } else {
            logger.info(`Updated position ${position.id}:`, actions);
          }
        }
      } catch (positionError) {
        logger.error(`Error processing position ${position.id}:`, positionError);
        // Continue with next position
      }
    }

    logger.info('Smart Trade Manager completed');
  } catch (error) {
    logger.error('Error in Smart Trade Manager:', error);
    throw error;
  }
}

/**
 * Edge Function handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await runSmartTradeManager();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Smart Trade Manager completed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Smart Trade Manager error:', error);
    
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

