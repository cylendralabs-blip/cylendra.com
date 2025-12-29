/**
 * Execute Trade Edge Function
 * 
 * Main entry point for trade execution
 * Orchestrates the complete trade execution flow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { createTradeRecord, createDCAOrderRecords } from './database.ts';
import { executeTradeStrategy, TradeExecutionRequest } from './trade-executor.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/types.ts';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest, parseJsonBody, handleError } from '../_shared/utils.ts';
import { performTradeGuards } from '../_shared/tradeGuards.ts';

const logger = createLogger('execute-trade');

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Phase Y: Parse body early to access autoTradeId in catch block
  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch (parseError) {
    // Will be handled in main catch block
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Get user from request
    // Support both user JWT token and service role with userId in body
    let user = await getUserFromRequest(req, supabaseClient);

    // If no user from token, check if this is a service role call with userId in body
    if (!user && body.userId) {
      // Verify this is a service role key (not anon key)
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      // If token matches service role key, use userId from body
      if (token === serviceRoleKey && body.userId) {
        user = { id: body.userId };
        logger.info('Service role call detected, using userId from body', { userId: body.userId });
      }
    }

    if (!user) {
      return new Response(
        JSON.stringify(createErrorResponse(
          'Authentication required',
          'AUTH_ERROR',
          'execute-trade',
          startTime
        )),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Phase Admin B: Check trade guards (Kill Switch, User Trading Status)
    const guardsCheck = await performTradeGuards(supabaseClient, user.id);
    if (!guardsCheck.allowed) {
      logger.warn('Trade execution blocked by guards', {
        userId: user.id,
        reason: guardsCheck.reason,
      });
      return new Response(
        JSON.stringify(createErrorResponse(
          guardsCheck.reason || 'Trading is currently disabled',
          'TRADING_DISABLED',
          'execute-trade',
          startTime
        )),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Phase 3.4: Check global risk limits if managed_by_bot is true
    if (managedByBot && body.api_key_id) {
      try {
        // Get bot settings for risk limits
        const { data: botSettings, error: botError } = await supabaseClient
          .from('bot_settings')
          .select('max_active_trades, risk_percentage, total_capital')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!botError && botSettings) {
          // Check max concurrent trades
          const { count: activeTradesCount, error: countError } = await supabaseClient
            .from('trades')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

          if (!countError && activeTradesCount !== null) {
            if (botSettings.max_active_trades && activeTradesCount >= botSettings.max_active_trades) {
              logger.warn('Global risk limit: Max concurrent trades exceeded', {
                userId: user.id,
                activeTrades: activeTradesCount,
                maxTrades: botSettings.max_active_trades
              });
              return new Response(
                JSON.stringify(createErrorResponse(
                  `Global risk limit exceeded: ${activeTradesCount} active trades (max: ${botSettings.max_active_trades}). Please close some positions or adjust settings.`,
                  'GLOBAL_RISK_LIMIT_EXCEEDED',
                  'execute-trade',
                  startTime
                )),
                {
                  status: 403,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              );
            }
          }

          // Check max total risk (if we can calculate it)
          // This would require summing risk across all positions
          // For now, we'll just log a warning if approaching limits
          logger.info('Global risk limits check passed', {
            userId: user.id,
            activeTrades: activeTradesCount,
            maxTrades: botSettings.max_active_trades
          });
        }
      } catch (riskCheckError) {
        // Don't block trade execution if risk check fails
        logger.warn('Error checking global risk limits:', riskCheckError);
      }
    }

    const {
      platform,
      symbol,
      marketType,
      orderType,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      initialAmount,
      dcaLevels,
      leverage,
      strategy,
      autoExecute,
      autoTradeId, // Phase Y: Auto trade ID for logging
      sourceMode, // Phase 1.5: Source mode (auto_bot, manual_execute, manual_smart_trade, signal_execution)
      managedByBot, // Phase 3.1: Whether bot should manage this trade
      managementProfileId // Phase 3.1: Bot management profile ID
    } = body;

    logger.info('Trade execution request received', {
      platform,
      symbol,
      marketType,
      orderType,
      autoExecute
    });

    // Get API key from database
    // platform can be either UUID (api_key id) or platform name
    // Check if platform is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(platform);

    let apiKey: any = null;
    let keyError: any = null;

    if (isUUID) {
      // Search by id (UUID)
      const { data, error } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('id', platform)
        .eq('user_id', user.id)
        .single();
      apiKey = data;
      keyError = error;
    } else {
      // Search by platform name
      const { data, error } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('platform', platform)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      apiKey = data;
      keyError = error;
    }

    if (keyError || !apiKey) {
      logger.error('API key lookup failed', {
        platform,
        isUUID,
        userId: user.id,
        error: keyError
      });
      throw new Error(`API key not found or not authorized. Platform: ${platform}, User: ${user.id}`);
    }

    logger.info(`Using API key for platform: ${apiKey.platform}`, {
      testnet: apiKey.testnet,
      platform: apiKey.platform
    });

    // Calculate quantity
    const quantity = initialAmount / entryPrice;

    // Execute trade strategy
    // Determine platform name from apiKey.platform
    // Handle platform variants: binance, binance-futures-testnet, okx, okx-demo, bybit, bybit-testnet
    let platformName: 'binance' | 'okx' | 'bybit' = 'binance';

    if (apiKey.platform.includes('okx')) {
      // Handles both 'okx' and 'okx-demo'
      platformName = 'okx';
    } else if (apiKey.platform.includes('bybit')) {
      // Handles both 'bybit' and 'bybit-testnet'
      platformName = 'bybit';
    } else if (apiKey.platform.includes('binance')) {
      // Handles both 'binance' and 'binance-futures-testnet'
      platformName = 'binance';
    }

    logger.info('Platform routing', {
      apiKeyPlatform: apiKey.platform,
      resolvedPlatform: platformName,
      testnet: apiKey.testnet
    });

    const executionResult = await executeTradeStrategy({
      platform: platformName,
      symbol,
      marketType,
      orderType,
      entryPrice,
      stopLossPrice: stopLossPrice || null,
      takeProfitPrice: takeProfitPrice || null,
      initialAmount,
      dcaLevels: dcaLevels || [],
      leverage: leverage || 1,
      strategy,
      autoExecute: autoExecute || false,
      apiKey: apiKey.api_key,
      secretKey: apiKey.secret_key,
      passphrase: apiKey.passphrase || undefined,
      testnet: apiKey.testnet || false,
      userId: user.id,
      supabaseClient
    });

    // Create trade record in database
    const entryOrder = executionResult.placedOrders.find((o: any) => o.orderType === 'ENTRY');

    // Determine source mode (default to manual_execute if not provided)
    const determinedSourceMode = sourceMode || 
      (autoTradeId ? 'auto_bot' : 'manual_execute');

    const trade = await createTradeRecord(supabaseClient, user.id, {
      symbol,
      trade_type: marketType,
      entry_price: entryPrice,
      stop_loss_price: stopLossPrice || null,
      take_profit_price: takeProfitPrice || null,
      quantity,
      total_invested: initialAmount,
      leverage: leverage || 1,
      status: executionResult.executionStatus,
      side: 'BUY',
      platform: apiKey.platform,
      max_dca_level: dcaLevels?.length || 1,
      dca_level: 1,
      platform_order_id: entryOrder?.orderId?.toString() || null,
      source_mode: determinedSourceMode as 'auto_bot' | 'manual_execute' | 'manual_smart_trade' | 'signal_execution',
      managed_by_bot: managedByBot || false,
      management_profile_id: managementProfileId || null
    });

    // Phase Y: Update auto_trade record if autoTradeId is provided
    if (autoTradeId) {
      try {
        const isSuccess = executionResult.executionStatus === 'ACTIVE' && executionResult.placedOrders.length > 0;

        // Update auto_trade with execution details
        const { error: updateError } = await supabaseClient
          .from('auto_trades')
          .update({
            executed_at: new Date().toISOString(),
            position_id: isSuccess ? trade.id : null,
            status: isSuccess ? 'accepted' : 'error',
            reason_code: isSuccess ? null : (executionResult.error ? 'EXECUTION_ERROR' : 'EXECUTION_FAILED')
          })
          .eq('id', autoTradeId);

        if (!updateError) {
          // Log exchange response
          await supabaseClient
            .from('auto_trade_logs')
            .insert({
              auto_trade_id: autoTradeId,
              step: 'exchange_response',
              message: isSuccess
                ? 'Trade executed successfully'
                : `Trade execution failed: ${executionResult.error || executionResult.executionStatus}`,
              data: {
                trade_id: trade.id,
                execution_status: executionResult.executionStatus,
                placed_orders: executionResult.placedOrders.length,
                error: executionResult.error || null
              }
            });
        } else {
          logger.warn('Failed to update auto_trade record', { error: updateError, autoTradeId });
        }
      } catch (logError) {
        // Don't fail the main process if logging fails
        logger.warn('Error updating auto_trade record', logError);
      }
    }

    // Create DCA order records with lifecycle tracking
    if (dcaLevels && dcaLevels.length > 0) {
      await createDCAOrderRecords(
        supabaseClient,
        user.id,
        trade.id,
        entryPrice,
        quantity,
        initialAmount,
        dcaLevels,
        executionResult.placedOrders,
        autoExecute || false,
        apiKey.platform,
        symbol,
        body.signalId || body.signal_id
      );
    }

    // Prepare response message
    const orderSummary = {
      entry: executionResult.placedOrders.filter((o: any) => o.orderType === 'ENTRY').length,
      dca: executionResult.placedOrders.filter((o: any) => o.orderType === 'DCA').length,
      stop_loss: executionResult.placedOrders.filter((o: any) => o.orderType === 'STOP_LOSS').length,
      take_profit: executionResult.placedOrders.filter((o: any) => o.orderType === 'TAKE_PROFIT').length
    };

    let responseMessage = '';
    if (autoExecute) {
      if (executionResult.executionStatus === 'ACTIVE') {
        responseMessage = `Trade strategy executed successfully on ${apiKey.platform}! Placed ${executionResult.placedOrders.length} orders: ${orderSummary.entry} entry + ${orderSummary.dca} DCA levels + ${orderSummary.stop_loss} stop loss + ${orderSummary.take_profit} take profit`;
      } else {
        responseMessage = `Trade saved but execution failed. Please check API settings or balance`;
      }
    } else {
      const orderTypeText = orderType === 'market' ? 'market order' : 'limit order';
      responseMessage = `Trade settings saved successfully using ${orderTypeText}. Enable auto-execute to start trading on the exchange`;
    }

    return new Response(
      JSON.stringify(createSuccessResponse({
        message: responseMessage,
        trade_id: trade.id,
        placed_orders: executionResult.placedOrders.length,
        execution_status: executionResult.executionStatus,
        orders_breakdown: orderSummary,
        platform_used: apiKey.platform,
        order_type: orderType
      }, 'execute-trade', startTime)),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    logger.error('Execute trade error', error instanceof Error ? error : undefined);

    // Phase Y: Update auto_trade record on error if autoTradeId is provided
    const autoTradeId = body?.autoTradeId;
    if (autoTradeId) {
      try {
        const supabaseClient = getSupabaseClient();
        await supabaseClient
          .from('auto_trades')
          .update({
            status: 'error',
            reason_code: 'EXCHANGE_ERROR'
          })
          .eq('id', autoTradeId);

        await supabaseClient
          .from('auto_trade_logs')
          .insert({
            auto_trade_id: autoTradeId,
            step: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            data: {
              error: error instanceof Error ? error.message : String(error)
            }
          });
      } catch (logError) {
        // Don't fail the main process if logging fails
        logger.warn('Error logging auto_trade error', logError);
      }
    }

    const errorResponse = handleError(error);
    const response = createErrorResponse(
      errorResponse.message,
      errorResponse.code,
      'execute-trade',
      startTime
    );

    return new Response(
      JSON.stringify(response),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
