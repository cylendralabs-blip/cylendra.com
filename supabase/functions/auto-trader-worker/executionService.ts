/**
 * Execution Service
 * 
 * Handles trade execution via execute-trade function
 */

import { getExecuteTradeUrl } from './config.ts';
// Note: These imports won't work in Deno Edge Functions
// We'll need to inline the logic or use a different approach
// For now, we'll use any types and build the payload directly

interface ProcessingSignal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  entry_price: number;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  confidence_score: number;
  strategy_name: string;
  timeframe: string;
  created_at: string;
}

interface BotSettingsForm {
  is_active: boolean;
  market_type: 'spot' | 'futures';
  total_capital: number;
  risk_percentage: number;
  initial_order_percentage: number;
  max_active_trades: number;
  dca_levels: number;
  take_profit_percentage: number;
  stop_loss_percentage: number;
  leverage: number;
  default_platform?: string;
  [key: string]: any;
}

/**
 * Build execution payload from signal and bot settings
 */
function buildExecutionPayload(params: {
  signal: ProcessingSignal;
  botSettings: BotSettingsForm;
  exchange: 'binance' | 'okx';
  isTestnet: boolean;
  availableBalance?: number;
  platformName?: string; // Platform name from API key
}): any {
  const { signal, botSettings, exchange, isTestnet, availableBalance, platformName } = params;

  // Determine side
  const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';

  // Capital allocation
  const totalCapital = botSettings.total_capital || 1000;
  const initialOrderPct = botSettings.initial_order_percentage || 25;
  const effectiveCapital = availableBalance
    ? Math.min(totalCapital, availableBalance * 0.95)
    : totalCapital;

  // Calculate risk-based position size
  const riskPct = botSettings.risk_percentage || 2;
  const maxRiskAmount = (effectiveCapital * riskPct) / 100;
  const entryPrice = signal.entry_price;
  const stopLossPct = botSettings.stop_loss_percentage || 5;
  const positionSize = maxRiskAmount / (stopLossPct / 100);
  const finalPositionSize = Math.min(positionSize, effectiveCapital);
  const initialAmount = (finalPositionSize * initialOrderPct) / 100;

  // Calculate stop loss and take profit
  const stopLossPrice = signal.stop_loss_price ||
    (isBuy
      ? entryPrice * (1 - stopLossPct / 100)
      : entryPrice * (1 + stopLossPct / 100)
    );

  const takeProfitPrice = signal.take_profit_price ||
    (isBuy
      ? entryPrice * (1 + (botSettings.take_profit_percentage || 3) / 100)
      : entryPrice * (1 - (botSettings.take_profit_percentage || 3) / 100)
    );

  // Build DCA levels
  const dcaLevels: Array<{ level: number; targetPrice: number; amount: number }> = [];
  if (botSettings.dca_levels && botSettings.dca_levels > 0) {
    const remainingAmount = finalPositionSize - initialAmount;
    const dcaAmountPerLevel = remainingAmount / botSettings.dca_levels;
    const priceDropPercent = 2; // 2% per level

    for (let i = 1; i <= botSettings.dca_levels; i++) {
      const dropPercent = priceDropPercent * i;
      const dcaPrice = isBuy
        ? entryPrice * (1 - dropPercent / 100)
        : entryPrice * (1 + dropPercent / 100);

      dcaLevels.push({
        level: i,
        targetPrice: dcaPrice,
        amount: dcaAmountPerLevel
      });
    }
  }

  // Use platformName if provided, otherwise use exchange
  // Note: execute-trade expects platform to be the API key ID (UUID) for lookup
  // But we also need to pass the actual platform name for execution
  // So we'll pass the API key ID as 'platform' and the platform name separately
  return {
    platform: platformName || exchange, // This will be used to look up API key in execute-trade
    symbol: signal.symbol,
    marketType: botSettings.market_type || 'spot',
    orderType: botSettings.order_type || 'market',  // Use bot settings instead of hardcoded
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    initialAmount,
    dcaLevels,
    leverage: botSettings.leverage || 1,
    strategy: signal.strategy_name,
    autoExecute: true,
    signalId: signal.id
  };
}

/**
 * Execute trade via execute-trade function
 */
export async function executeTrade(
  signal: ProcessingSignal,
  botSettings: BotSettingsForm,
  apiKey: {
    id: string;
    platform: string;
    api_key: string;
    secret_key: string;
    passphrase?: string;
    testnet: boolean;
  },
  availableBalance?: number,
  autoTradeId?: string // Phase Y: Auto trade ID for logging
): Promise<{
  success: boolean;
  tradeId?: string;
  error?: string;
  executionResult?: any;
}> {
  try {
    console.log(`Executing trade for signal ${signal.id}...`);

    // Determine exchange from platform
    const exchange: 'binance' | 'okx' = apiKey.platform.includes('binance')
      ? 'binance'
      : apiKey.platform.includes('okx')
        ? 'okx'
        : 'binance'; // Default to binance

    // Build execution payload
    const executePayload = buildExecutionPayload({
      signal,
      botSettings,
      exchange,
      isTestnet: apiKey.testnet,
      availableBalance
    });

    // Add API key credentials
    Object.assign(executePayload, {
      apiKey: apiKey.api_key,
      secretKey: apiKey.secret_key,
      passphrase: apiKey.passphrase,
      testnet: apiKey.testnet,
      userId: signal.user_id,
      autoTradeId: autoTradeId // Phase Y: Pass auto_trade_id to execute-trade
    });

    // Call execute-trade function
    const executeTradeUrl = getExecuteTradeUrl();
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log(`Calling execute-trade function at: ${executeTradeUrl}`);

    // Ensure userId is in payload for service role authentication
    executePayload.userId = signal.user_id;

    const response = await fetch(executeTradeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify(executePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Execute-trade failed with status ${response.status}:`, errorText);
      return {
        success: false,
        error: `Execute-trade failed: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();

    console.log('Execute-trade response:', JSON.stringify(result, null, 2));

    // Check if result has error
    if (result.error || !result.success) {
      console.error('Execute-trade returned error:', result);
      return {
        success: false,
        error: result.error?.message || result.error || result.message || 'Unknown error from execute-trade',
        executionResult: result.data || result
      };
    }

    // Check execution status
    const executionStatus = result.data?.execution_status || result.execution_status;

    if (executionStatus === 'FAILED' || executionStatus === 'PENDING') {
      console.warn(`Trade execution status: ${executionStatus}`);
      return {
        success: false,
        error: result.data?.message || `Trade execution ${executionStatus.toLowerCase()}`,
        executionResult: result.data || result
      };
    }

    // Extract trade ID from result
    const tradeId = result.data?.trade_id || result.trade_id;

    if (!tradeId) {
      console.error('No trade_id in response:', result);
      return {
        success: false,
        error: 'No trade_id returned from execute-trade',
        executionResult: result.data || result
      };
    }

    console.log(`Trade executed successfully! Trade ID: ${tradeId}, Status: ${executionStatus}`);

    return {
      success: true,
      tradeId,
      executionResult: result.data || result
    };

  } catch (error) {
    console.error('Error executing trade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

